// ===== اختبارات محرّك الصوت — محاكاة كاملة لعنصر الصوت =====
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AudioEngine, type Track } from "@/lib/services/audioEngine";

type Behavior = (url: string) => "ok" | "fail";

class FakeAudio {
  static behavior: Behavior = () => "ok";
  listeners = new Map<string, Set<(...args: never[]) => void>>();
  src = "";
  currentTime = 0;
  get duration() {
    // البث المباشر يبلّغ Infinity في المتصفحات الحقيقية
    return this.src.includes("/radio/") ? Infinity : 1823;
  }
  volume = 1;
  muted = false;
  playbackRate = 1;
  defaultPlaybackRate = 1;
  paused = true;
  preload = "";
  addEventListener(t: string, f: (...args: never[]) => void) {
    if (!this.listeners.has(t)) this.listeners.set(t, new Set());
    this.listeners.get(t)!.add(f);
  }
  removeEventListener(t: string, f: (...args: never[]) => void) {
    this.listeners.get(t)?.delete(f);
  }
  dispatch(t: string) {
    this.listeners.get(t)?.forEach((f) => (f as () => void)());
  }
  removeAttribute() {}
  load() {
    const src = this.src;
    queueMicrotask(() => {
      if (FakeAudio.behavior(src) === "fail") this.dispatch("error");
      else this.dispatch("canplay");
    });
  }
  play(): Promise<void> {
    if (FakeAudio.behavior(this.src) === "fail") {
      return Promise.reject(new DOMException("bad source", "NotSupportedError"));
    }
    this.paused = false;
    queueMicrotask(() => this.dispatch("playing"));
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    queueMicrotask(() => this.dispatch("pause"));
  }
}

const surahTrack = (surah: number): Track => ({
  kind: "surah",
  surah,
  reciterId: "ar.alafasy",
  title: "تجربة",
});

describe("محرّك الصوت", () => {
  let engine: AudioEngine;
  let snaps: string[];

  beforeEach(() => {
    FakeAudio.behavior = () => "ok";
    (globalThis as unknown as { Audio: unknown }).Audio = FakeAudio as unknown as typeof Audio;
    engine = new AudioEngine();
    snaps = [];
    engine.subscribe((s) => snaps.push(s.status));
  });

  afterEach(() => {
    engine.destroy();
  });

  it("يشغّل سورة من المصدر الأساسي ويصل لحالة playing", async () => {
    await engine.play(surahTrack(1));
    expect(engine.getSnapshot().status).toBe("playing");
    expect(engine.getSnapshot().track?.kind).toBe("surah");
    expect(snaps[0]).toBe("idle");
    expect(snaps).toContain("loading");
  });

  it("يستخدم المصدر الاحتياطي عند فشل الأساسي", async () => {
    FakeAudio.behavior = (url) =>
      url.includes("cdn.islamic.network") ? "fail" : "ok";
    await engine.play(surahTrack(2));
    const s = engine.getSnapshot();
    expect(s.status).toBe("playing");
    expect(s.sourceLabel).toBe("المصدر الاحتياطي");
  });

  it("يعرض خطأً واضحاً عند فشل كل المصادر — لا تحميل أبدي", async () => {
    FakeAudio.behavior = () => "fail";
    await engine.play(surahTrack(3));
    const s = engine.getSnapshot();
    expect(s.status).toBe("error");
    expect(s.error).toBeTruthy();
    expect(s.error).toContain("تعذّر");
  });

  it("زر إعادة المحاولة ينجح بعد عودة الشبكة", async () => {
    FakeAudio.behavior = () => "fail";
    await engine.play(surahTrack(3));
    expect(engine.getSnapshot().status).toBe("error");
    FakeAudio.behavior = () => "ok";
    await engine.retry();
    expect(engine.getSnapshot().status).toBe("playing");
  });

  it("تبديل المقاطع يلغي العملية الأقدم ولا يشغّل مقطعين", async () => {
    const p1 = engine.play(surahTrack(5));
    const p2 = engine.play(surahTrack(6));
    await Promise.all([p1, p2]);
    const s = engine.getSnapshot();
    expect(s.track?.kind === "surah" && s.track.surah).toBe(6);
    expect(s.status).toBe("playing");
  });

  it("عناصر التحكم: إيقاف، استئناف، انتقال، سرعة، صوت", async () => {
    await engine.play(surahTrack(10));
    engine.pause();
    expect(engine.getSnapshot().status).toBe("paused");
    await engine.resume();
    expect(engine.getSnapshot().status).toBe("playing");
    engine.seek(60);
    expect(engine.getSnapshot().currentTime).toBe(60);
    engine.setRate(1.5);
    expect(engine.getSnapshot().rate).toBe(1.5);
    engine.setVolume(0.3);
    expect(engine.getSnapshot().volume).toBe(0.3);
    engine.toggleMute();
    expect(engine.getSnapshot().muted).toBe(true);
    engine.stop();
    expect(engine.getSnapshot().status).toBe("idle");
    expect(engine.getSnapshot().track).toBeNull();
  });

  it("يشغّل محطة إذاعية بلا مدة ولا يخلطها مع التلاوة", async () => {
    await engine.play(surahTrack(7));
    await engine.play({
      kind: "radio",
      stationId: "tarateel",
      title: "إذاعة التراتيل",
      url: "https://backup.qurango.net/radio/tarateel",
    });
    const s = engine.getSnapshot();
    expect(s.status).toBe("playing");
    expect(s.track?.kind).toBe("radio");
    expect(s.duration).toBe(0);
  });

  it("يشغّل من المخزن المحلي حتى لو انقطعت الشبكة", async () => {
    engine.offlineCache = {
      get: async () => new Blob(["fake-audio"], { type: "audio/mpeg" }),
    };
    FakeAudio.behavior = (url) => (url.startsWith("blob:") ? "ok" : "fail");
    await engine.play(surahTrack(2));
    const s = engine.getSnapshot();
    expect(s.status).toBe("playing");
    expect(s.sourceLabel).toBe("المخزن المحلي");
  });

  it("يتجاوز المخزن التالف إلى الشبكة تلقائياً", async () => {
    engine.offlineCache = {
      get: async () => new Blob(["corrupt"], { type: "audio/mpeg" }),
    };
    FakeAudio.behavior = (url) => (url.startsWith("blob:") ? "fail" : "ok");
    await engine.play(surahTrack(2));
    const s = engine.getSnapshot();
    expect(s.status).toBe("playing");
    expect(s.sourceLabel).toBe("المصدر الأساسي");
  });

  it("غياب التخزين المحلي لا يبطئ التشغيل من الشبكة", async () => {
    engine.offlineCache = { get: async () => undefined };
    await engine.play(surahTrack(2));
    expect(engine.getSnapshot().status).toBe("playing");
    expect(engine.getSnapshot().sourceLabel).toBe("المصدر الأساسي");
  });

  it("انتهاء السورة يستدعي معالج التقدّم", async () => {
    let advanced: number | null = null;
    engine.onEndedAdvance = (t) => {
      advanced = t.surah;
    };
    await engine.play(surahTrack(8));
    const audio = (engine as unknown as { audio: FakeAudio }).audio;
    audio.dispatch("ended");
    expect(engine.getSnapshot().status).toBe("ended");
    expect(advanced).toBe(8);
  });
});
