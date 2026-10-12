// ===== متجر تفضيلات المستخدم — محفوظ محلياً =====
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_RECITER } from "../data/audio";

export interface LastRead {
  surah: number;
  ayah: number;
  at: number;
}
export interface LastPlayed {
  surah: number;
  position: number;
  at: number;
}

interface PrefsState {
  theme: "dark" | "light";
  fontScale: number;
  reciterId: string;
  playbackRate: number;
  volume: number;
  cityId: string;
  calcMethod: string;
  autoCacheAudio: boolean;
  favSurahs: number[];
  favHadiths: string[];
  favDhikr: string[];
  favAyahs: string[];
  lastRead: LastRead | null;
  lastPlayed: LastPlayed | null;
  readProgress: Record<string, number>;
  dhikrCounts: Record<string, { date: string; count: number }>;
  // إجراءات
  setTheme: (t: "dark" | "light") => void;
  setFontScale: (v: number) => void;
  setReciter: (id: string) => void;
  setPlaybackRate: (r: number) => void;
  setVolumePref: (v: number) => void;
  setCity: (id: string) => void;
  setCalcMethod: (m: string) => void;
  setAutoCacheAudio: (v: boolean) => void;
  toggleFavSurah: (n: number) => void;
  toggleFavHadith: (id: string) => void;
  toggleFavDhikr: (id: string) => void;
  toggleFavAyah: (key: string) => void;
  setLastRead: (lr: LastRead) => void;
  setLastPlayed: (lp: LastPlayed) => void;
  setReadProgress: (surah: number, ayah: number) => void;
  setDhikrCount: (id: string, date: string, count: number) => void;
  resetAll: () => void;
}

const initialData = {
  theme: "dark" as const,
  fontScale: 1,
  reciterId: DEFAULT_RECITER,
  playbackRate: 1,
  volume: 1,
  cityId: "cairo",
  calcMethod: "Egyptian",
  autoCacheAudio: true,
  favSurahs: [] as number[],
  favHadiths: [] as string[],
  favDhikr: [] as string[],
  favAyahs: [] as string[],
  lastRead: null as LastRead | null,
  lastPlayed: null as LastPlayed | null,
  readProgress: {} as Record<string, number>,
  dhikrCounts: {} as Record<string, { date: string; count: number }>,
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      ...initialData,
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) =>
        set({ fontScale: Math.min(1.4, Math.max(0.85, fontScale)) }),
      setReciter: (reciterId) => set({ reciterId }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setVolumePref: (volume) => set({ volume }),
      setCity: (cityId) => set({ cityId }),
      setCalcMethod: (calcMethod) => set({ calcMethod }),
      setAutoCacheAudio: (autoCacheAudio) => set({ autoCacheAudio }),
      toggleFavSurah: (n) =>
        set({
          favSurahs: get().favSurahs.includes(n)
            ? get().favSurahs.filter((x) => x !== n)
            : [...get().favSurahs, n],
        }),
      toggleFavHadith: (id) =>
        set({
          favHadiths: get().favHadiths.includes(id)
            ? get().favHadiths.filter((x) => x !== id)
            : [...get().favHadiths, id],
        }),
      toggleFavDhikr: (id) =>
        set({
          favDhikr: get().favDhikr.includes(id)
            ? get().favDhikr.filter((x) => x !== id)
            : [...get().favDhikr, id],
        }),
      toggleFavAyah: (key) =>
        set({
          favAyahs: get().favAyahs.includes(key)
            ? get().favAyahs.filter((x) => x !== key)
            : [...get().favAyahs, key],
        }),
      setLastRead: (lastRead) => set({ lastRead }),
      setLastPlayed: (lastPlayed) => set({ lastPlayed }),
      setReadProgress: (surah, ayah) =>
        set({
          readProgress: { ...get().readProgress, [surah]: ayah },
        }),
      setDhikrCount: (id, date, count) =>
        set({ dhikrCounts: { ...get().dhikrCounts, [id]: { date, count } } }),
      resetAll: () => set({ ...initialData }),
    }),
    {
      name: "noor-prefs-v1",
      storage: createJSONStorage(() => localStorage),
      // لا تهيئة أثناء التقييم — تُستكمل على العميل بعد التركيب
      // حتى يتطابق أول رسم على العميل مع مخرجات الخادم (لا تعارض hydration)
      skipHydration: true,
    }
  )
);
