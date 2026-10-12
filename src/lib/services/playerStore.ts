// ===== متجر المشغّل — يربط المحرّك بواجهة React ويحفظ الاستماع =====
"use client";
import { create } from "zustand";
import {
  audioEngine,
  type PlayerSnapshot,
  type Track,
} from "./audioEngine";
import { SURAHS } from "../data/surahs";
import { usePrefs } from "./prefsStore";
import { maybeAutoCache, useDownloads } from "./offlineAudio";

export type RepeatMode = "off" | "one" | "all";

interface PlayerState extends PlayerSnapshot {
  reciterId: string;
  repeat: RepeatMode;
  fullOpen: boolean;
  hydrated: boolean;
  // إجراءات
  init: () => void;
  playSurah: (surah: number, opts?: { resumeAt?: number }) => Promise<void>;
  playRadio: (station: { id: string; name: string; url: string }) => Promise<void>;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  retry: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  seekBy: (d: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setRate: (r: number) => void;
  setReciterLive: (id: string) => void;
  setRepeat: (m: RepeatMode) => void;
  setFullOpen: (open: boolean) => void;
  stop: () => void;
}

let lastPosSave = 0;

export const usePlayer = create<PlayerState>((set, get) => {
  // ربط لقطة المحرّك بالمتجر
  audioEngine.subscribe((snap) => {
    set({ ...snap });
    // حفظ موضع الاستماع كل ٥ ثوانٍ أثناء التشغيل
    if (
      snap.status === "playing" &&
      snap.track?.kind === "surah" &&
      Date.now() - lastPosSave > 5000
    ) {
      lastPosSave = Date.now();
      usePrefs.getState().setLastPlayed({
        surah: snap.track.surah,
        position: Math.floor(snap.currentTime),
        at: Date.now(),
      });
    }
    // تخزين تلقائي في الخلفية للاستماع لاحقاً دون إنترنت
    if (snap.status === "playing" && snap.track?.kind === "surah") {
      maybeAutoCache(snap.track.surah, snap.track.reciterId);
    }
  });

  // عند انتهاء سورة: تكرار أو انتقال للسورة التالية
  audioEngine.onEndedAdvance = (track) => {
    const mode = get().repeat;
    if (mode === "one") {
      void get().playSurah(track.surah);
    } else if (mode === "all" && track.surah < SURAHS.length) {
      void get().playSurah(track.surah + 1);
    }
  };

  return {
    status: "idle",
    track: null,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    rate: 1,
    error: null,
    sourceLabel: null,
    reciterId: "ar.alafasy",
    repeat: "off",
    fullOpen: false,
    hydrated: false,

    init: () => {
      if (get().hydrated || typeof window === "undefined") return;
      void useDownloads.getState().hydrate();
      const prefs = usePrefs.getState();
      set({
        reciterId: prefs.reciterId,
        hydrated: true,
        volume: prefs.volume,
        rate: prefs.playbackRate,
      });
      audioEngine.setVolume(prefs.volume);
      audioEngine.setRate(prefs.playbackRate);
    },

    playSurah: async (surah, opts) => {
      const meta = SURAHS[surah - 1];
      if (!meta) return;
      const reciterId = get().reciterId;
      const track: Track = {
        kind: "surah",
        surah,
        reciterId,
        title: `سورة ${meta.name}`,
      };
      usePrefs.getState().setLastPlayed({ surah, position: 0, at: Date.now() });
      await audioEngine.play(track, opts);
    },

    playRadio: async (station) => {
      const track: Track = {
        kind: "radio",
        stationId: station.id,
        title: station.name,
        url: station.url,
      };
      await audioEngine.play(track);
    },

    toggle: () => audioEngine.toggle(),
    pause: () => audioEngine.pause(),
    resume: () => void audioEngine.resume(),
    retry: () => void audioEngine.retry(),
    stop: () => audioEngine.stop(),

    next: () => {
      const t = get().track;
      if (t?.kind === "surah" && t.surah < SURAHS.length) {
        void get().playSurah(t.surah + 1);
      }
    },
    prev: () => {
      const t = get().track;
      if (t?.kind === "surah" && t.surah > 1) {
        void get().playSurah(t.surah - 1);
      }
    },

    seek: (s) => audioEngine.seek(s),
    seekBy: (d) => audioEngine.seekBy(d),
    setVolume: (v) => {
      audioEngine.setVolume(v);
      usePrefs.getState().setVolumePref(v);
    },
    toggleMute: () => audioEngine.toggleMute(),
    setRate: (r) => {
      audioEngine.setRate(r);
      usePrefs.getState().setPlaybackRate(r);
    },

    setReciterLive: (id) => {
      set({ reciterId: id });
      usePrefs.getState().setReciter(id);
      // إن كانت سورة قيد التشغيل، أعد تحميلها بالقارئ الجديد من نفس الموضع
      const t = get().track;
      if (t?.kind === "surah") {
        const pos = get().currentTime;
        void get().playSurah(t.surah, { resumeAt: pos });
      }
    },

    setRepeat: (repeat) => set({ repeat }),
    setFullOpen: (fullOpen) => set({ fullOpen }),
  };
});
