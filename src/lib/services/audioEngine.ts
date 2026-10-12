// ===== محرّك التشغيل الصوتي — عنصر صوت واحد مُدار بالكامل =====
// صراع حالة صريح: idle → loading → ready → playing ⇄ paused ⇄ buffering → ended/error
import { getReciter } from "../data/audio";

export type PlayerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export type Track =
  | { kind: "surah"; surah: number; reciterId: string; title: string }
  | { kind: "radio"; stationId: string; title: string; url: string };

export interface PlayerSnapshot {
  status: PlayerStatus;
  track: Track | null;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  rate: number;
  error: string | null;
  /** المصدر المستخدم حالياً (أساسي أم احتياطي) */
  sourceLabel: string | null;
}

type Listener = (s: PlayerSnapshot) => void;

const LOAD_TIMEOUT_MS = 20000;

export class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private state: PlayerSnapshot = {
    status: "idle",
    track: null,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    rate: 1,
    error: null,
    sourceLabel: null,
  };
  /** رقم عملية التشغيل الجارية — يمنع أي نتيجة قديمة من الكتابة فوق الحالة */
  private op = 0;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private lastRadioTrack: Extract<Track, { kind: "radio" }> | null = null;
  /**
   * مزوّد التخزين دون اتصال — يُضبط من طبقة التنزيلات.
   * عند توفر نسخة محفوظة تُشغَّل فوراً حتى بدون إنترنت.
   */
  offlineCache: {
    get(surah: number, reciterId: string): Promise<Blob | undefined>;
  } | null = null;
  private objectUrl: string | null = null;
  onEndedAdvance: ((track: Extract<Track, { kind: "surah" }>) => void) | null =
    null;

  // ---------- اشتراكات ----------
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
  getSnapshot(): PlayerSnapshot {
    return this.state;
  }
  private patch(p: Partial<PlayerSnapshot>) {
    this.state = { ...this.state, ...p };
    for (const fn of this.listeners) fn(this.state);
  }

  // ---------- إنشاء العنصر وربط الأحداث مرة واحدة ----------
  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.preload = "none";
    a.addEventListener("timeupdate", () =>
      this.patch({ currentTime: a.currentTime })
    );
    a.addEventListener("durationchange", () => {
      const d = a.duration;
      if (Number.isFinite(d) && d > 0) this.patch({ duration: d });
    });
    a.addEventListener("playing", () =>
      this.patch({
        status: "playing",
        error: null,
        duration:
          Number.isFinite(a.duration) && a.duration > 0
            ? a.duration
            : this.state.duration,
      })
    );
    a.addEventListener("pause", () => {
      if (
        this.state.status === "playing" ||
        this.state.status === "buffering"
      ) {
        this.patch({ status: "paused" });
      }
    });
    a.addEventListener("waiting", () => {
      if (this.state.status === "playing") this.patch({ status: "buffering" });
    });
    a.addEventListener("ended", () => {
      this.patch({ status: "ended", currentTime: 0 });
      const t = this.state.track;
      if (t?.kind === "surah") this.onEndedAdvance?.(t);
    });
    a.volume = this.state.volume;
    a.defaultPlaybackRate = this.state.rate;
    this.audio = a;
    return a;
  }

  private clearLoadTimer() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
  }

  private stopInternal() {
    this.clearLoadTimer();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
    }
  }

  // ---------- واجهة التشغيل ----------
  /**
   * تشغيل مقطع جديد. يجب استدعاؤها من حدث مستخدم (نقرة) لضمان
   * التوافق مع سياسات التشغيل التلقائي في المتصفحات وAndroid WebView.
   */
  async play(track: Track, opts: { resumeAt?: number } = {}): Promise<void> {
    const token = ++this.op;
    const a = this.ensureAudio();
    this.stopInternal();
    if (track.kind === "radio") this.lastRadioTrack = track;

    this.patch({
      status: "loading",
      track,
      error: null,
      currentTime: 0,
      duration: track.kind === "radio" ? 0 : this.state.duration,
      sourceLabel: null,
    });

    // أولاً: النسخة المحفوظة محلياً (تعمل دون إنترنت)
    const candidates: { url: string; label: string }[] = [];
    if (track.kind === "surah" && this.offlineCache) {
      try {
        const blob = await this.offlineCache.get(track.surah, track.reciterId);
        if (token !== this.op) return;
        if (blob && blob.size > 0) {
          this.objectUrl = URL.createObjectURL(blob);
          candidates.push({ url: this.objectUrl, label: "المخزن المحلي" });
        }
      } catch {
        /* فشل قراءة المخزن — نكمل للشبكة */
      }
    }
    candidates.push(...this.resolveSources(track));
    for (const src of candidates) {
      if (token !== this.op) return; // عملية أحدث ألغت هذه
      this.patch({ sourceLabel: src.label });
      const ok = await this.attemptSource(a, src.url, token);
      if (token !== this.op) return;
      if (!ok) continue;
      // جاهز للتشغيل
      this.patch({ status: "ready" });
      if (opts.resumeAt && opts.resumeAt > 0 && a.duration > opts.resumeAt) {
        try {
          a.currentTime = opts.resumeAt;
        } catch {
          /* بعض المصادر لا تدعم الانتقال المبكر */
        }
      }
      try {
        await a.play();
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "AbortError") return; // تم إيقافه بفعل عملية أحدث
        if (name === "NotAllowedError") {
          // سياسة التشغيل التلقائي: نبقي الجاهزية وننتظر نقرة المستخدم
          this.patch({ status: "ready" });
          return;
        }
        continue; // جرّب المصدر التالي
      }
      if (token === this.op) this.patch({ status: "playing" });
      this.updateMediaSession();
      return;
    }
    if (token !== this.op) return;
    this.patch({
      status: "error",
      error:
        track.kind === "radio"
          ? "تعذّر الاتصال بالبث المباشر حالياً. تحقّق من الإنترنت وأعد المحاولة."
          : "تعذّر تشغيل التلاوة من جميع المصادر المتاحة. تحقّق من الاتصال بالإنترنت ثم أعد المحاولة.",
    });
  }

  /** ترتيب المصادر: الأساسي ثم الاحتياطي الموثق */
  private resolveSources(track: Track): { url: string; label: string }[] {
    if (track.kind === "radio") return [{ url: track.url, label: "بث مباشر" }];
    const reciter = getReciter(track.reciterId);
    const list = [{ url: reciter.primary(track.surah), label: "المصدر الأساسي" }];
    if (reciter.fallback) {
      list.push({ url: reciter.fallback(track.surah), label: "المصدر الاحتياطي" });
    }
    return list;
  }

  /** محاولة تحميل مصدر واحد مع مهلة زمنية وإلغاء آمن */
  private attemptSource(
    a: HTMLAudioElement,
    url: string,
    token: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(ok);
      };
      const onError = () => done(false);
      const onCanPlay = () => done(true);
      const cleanup = () => {
        this.clearLoadTimer();
        a.removeEventListener("error", onError);
        a.removeEventListener("canplay", onCanPlay);
      };
      a.addEventListener("error", onError, { once: true });
      a.addEventListener("canplay", onCanPlay, { once: true });
      this.loadTimer = setTimeout(() => {
        if (token === this.op) done(false);
      }, LOAD_TIMEOUT_MS);
      try {
        a.src = url;
        a.load();
      } catch {
        done(false);
      }
    });
  }

  // ---------- عناصر التحكم ----------
  pause() {
    if (this.audio && !this.audio.paused) this.audio.pause();
    this.patch({ status: this.state.track ? "paused" : "idle" });
  }

  async resume() {
    if (!this.audio || !this.state.track) return;
    try {
      await this.audio.play();
      this.patch({ status: "playing" });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        this.patch({ status: "ready" });
      } else {
        this.patch({ status: "error", error: "تعذّر استئناف التشغيل." });
      }
    }
  }

  toggle() {
    const s = this.state.status;
    if (s === "playing" || s === "buffering") this.pause();
    else if (s === "paused" || s === "ready" || s === "ended") void this.resume();
  }

  async retry() {
    const t = this.state.track;
    if (!t) return;
    await this.play(t);
  }

  seek(seconds: number) {
    if (!this.audio) return;
    const max = this.state.duration;
    const v = Number.isFinite(max) && max > 0 ? Math.min(seconds, max) : seconds;
    try {
      this.audio.currentTime = Math.max(0, v);
      this.patch({ currentTime: this.audio.currentTime });
    } catch {
      /* تجاهل */
    }
  }

  seekBy(delta: number) {
    this.seek((this.audio?.currentTime ?? this.state.currentTime) + delta);
  }

  setVolume(v: number) {
    const vol = Math.min(1, Math.max(0, v));
    if (this.audio) this.audio.volume = vol;
    this.patch({ volume: vol, muted: vol === 0 ? this.state.muted : false });
  }

  toggleMute() {
    if (!this.audio) return;
    const m = !this.state.muted;
    this.audio.muted = m;
    this.patch({ muted: m });
  }

  setRate(rate: number) {
    if (this.audio) {
      this.audio.playbackRate = rate;
      this.audio.defaultPlaybackRate = rate;
    }
    this.patch({ rate });
  }

  stop() {
    this.op++;
    this.stopInternal();
    this.patch({
      status: "idle",
      track: null,
      currentTime: 0,
      duration: 0,
      error: null,
      sourceLabel: null,
    });
    this.clearMediaSession();
  }

  destroy() {
    this.stop();
    this.listeners.clear();
    this.audio = null;
  }

  get lastRadio(): Extract<Track, { kind: "radio" }> | null {
    return this.lastRadioTrack;
  }

  // ---------- Media Session (عند التوفر فقط) ----------
  private updateMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    try {
      const t = this.state.track;
      if (!t) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist:
          t.kind === "surah"
            ? getReciter(t.reciterId).name
            : "نور الإسلام — إذاعة",
        album: "نور الإسلام",
      });
      navigator.mediaSession.setActionHandler("play", () => void this.resume());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        this.seekBy(-15)
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        this.seekBy(15)
      );
    } catch {
      /* غير مدعوم — تجاهل */
    }
  }

  private clearMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    try {
      navigator.mediaSession.metadata = null;
    } catch {
      /* تجاهل */
    }
  }
}

// نسخة واحدة على مستوى التطبيق
export const audioEngine = new AudioEngine();
