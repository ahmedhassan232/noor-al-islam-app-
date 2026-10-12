// ===== تنزيل التلاوات والاستماع دون إنترنت =====
// - يخزّن ملفات MP3 في IndexedDB (مفتاح: قارئ|سورة — لا اختلاط بين القرّاء)
// - تنزيل صريح بزر + تخزين تلقائي أثناء الاستماع (قابل للإيقاف)
// - المشغّل يقرأ من المخزن أولاً فيعمل دون شبكة
"use client";
import { create } from "zustand";
import {
  AUDIO_STORE,
  idbSet,
  idbGetAll,
  idbDelete,
  idbClear,
  openDB,
} from "./storage";
import { audioEngine } from "./audioEngine";
import { getReciter } from "../data/audio";
import { usePrefs } from "./prefsStore";
import { fetchWithTimeout, arDigits } from "../utils";
import { toast } from "./toastStore";
import { SURAHS } from "../data/surahs";

export interface CachedAudioEntry {
  key: string;
  surah: number;
  reciterId: string;
  size: number;
  downloadedAt: number;
  blob: Blob;
}

export function audioKey(surah: number, reciterId: string): string {
  return `${reciterId}|${surah}`;
}

// ---------- قراءة من المخزن ----------
async function getCachedBlob(
  surah: number,
  reciterId: string
): Promise<Blob | undefined> {
  try {
    const db = await openDB();
    const entry = await new Promise<CachedAudioEntry | undefined>((resolve) => {
      const tx = db.transaction(AUDIO_STORE, "readonly");
      const req = tx.objectStore(AUDIO_STORE).get(audioKey(surah, reciterId));
      req.onsuccess = () => resolve(req.result as CachedAudioEntry | undefined);
      req.onerror = () => resolve(undefined);
    });
    if (entry && entry.blob && entry.blob.size > 50000) return entry.blob;
    return undefined;
  } catch {
    return undefined;
  }
}

// ربط المشغّل بالمخزن المحلي (أولوية القراءة)
audioEngine.offlineCache = { get: getCachedBlob };

// ---------- جلب مع نسبة إنجاز ----------
async function fetchAudioWithProgress(
  urls: string[],
  onProgress: (loaded: number, total: number) => void
): Promise<{ blob: Blob; size: number }> {
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, {}, 60000);
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("audio")) {
        lastError = new Error(`استجابة غير صالحة (${res.status})`);
        continue;
      }
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body?.getReader();
      if (!reader) {
        const blob = await res.blob();
        if (blob.size < 50000) continue;
        return { blob, size: blob.size };
      }
      const chunks: BlobPart[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress(loaded, total);
      }
      if (loaded < 50000) {
        lastError = new Error("الملف المستلم غير مكتمل");
        continue;
      }
      return {
        blob: new Blob(chunks, { type: "audio/mpeg" }),
        size: loaded,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error("تعذّر تنزيل التلاوة");
}

// ---------- متجر التنزيلات ----------
export type DownloadStatus = "downloading" | "done";

export interface DownloadRecord {
  key: string;
  surah: number;
  reciterId: string;
  status: DownloadStatus;
  progress: number; // 0..1
  size: number;
  downloadedAt: number;
}

interface DownloadsState {
  records: Record<string, DownloadRecord>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  download: (surah: number, reciterId: string) => Promise<boolean>;
  remove: (surah: number, reciterId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isDone: (surah: number, reciterId: string) => boolean;
}

const inFlight = new Set<string>();

export const useDownloads = create<DownloadsState>((set, get) => ({
  records: {},
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated || typeof window === "undefined") return;
    const all = await idbGetAll<CachedAudioEntry>(AUDIO_STORE);
    const records: Record<string, DownloadRecord> = { ...get().records };
    for (const e of all) {
      if (e?.key && e.blob?.size) {
        records[e.key] = {
          key: e.key,
          surah: e.surah,
          reciterId: e.reciterId,
          status: "done",
          progress: 1,
          size: e.blob.size,
          downloadedAt: e.downloadedAt ?? 0,
        };
      }
    }
    set({ records, hydrated: true });
  },

  download: async (surah, reciterId) => {
    const key = audioKey(surah, reciterId);
    if (inFlight.has(key)) return false;
    if (get().records[key]?.status === "done") return true;
    const meta = SURAHS[surah - 1];
    if (!meta) return false;

    inFlight.add(key);
    set({
      records: {
        ...get().records,
        [key]: {
          key,
          surah,
          reciterId,
          status: "downloading",
          progress: 0,
          size: 0,
          downloadedAt: Date.now(),
        },
      },
    });

    try {
      const reciter = getReciter(reciterId);
      const urls = [reciter.primary(surah)];
      if (reciter.fallback) urls.push(reciter.fallback(surah));
      const { blob, size } = await fetchAudioWithProgress(urls, (loaded, total) => {
        const progress = total > 0 ? Math.min(0.99, loaded / total) : 0.5;
        const cur = get().records[key];
        if (cur) {
          set({
            records: {
              ...get().records,
              [key]: { ...cur, progress },
            },
          });
        }
      });
      const entry: CachedAudioEntry = {
        key,
        surah,
        reciterId,
        size,
        downloadedAt: Date.now(),
        blob,
      };
      await idbSet(key, entry, AUDIO_STORE);
      set({
        records: {
          ...get().records,
          [key]: {
            key,
            surah,
            reciterId,
            status: "done",
            progress: 1,
            size,
            downloadedAt: entry.downloadedAt,
          },
        },
      });
      return true;
    } catch {
      const records = { ...get().records };
      delete records[key];
      set({ records });
      return false;
    } finally {
      inFlight.delete(key);
    }
  },

  remove: async (surah, reciterId) => {
    const key = audioKey(surah, reciterId);
    await idbDelete(key, AUDIO_STORE);
    const records = { ...get().records };
    delete records[key];
    set({ records });
  },

  clearAll: async () => {
    await idbClear(AUDIO_STORE);
    const records: Record<string, DownloadRecord> = {};
    for (const [k, v] of Object.entries(get().records)) {
      if (v.status === "downloading") records[k] = v;
    }
    set({ records });
  },

  isDone: (surah, reciterId) =>
    get().records[audioKey(surah, reciterId)]?.status === "done",
}));

// ---------- التخزين التلقائي أثناء الاستماع ----------
const autoChecked = new Set<string>();

export function maybeAutoCache(surah: number, reciterId: string): void {
  const prefs = usePrefs.getState();
  if (!prefs.autoCacheAudio) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const key = audioKey(surah, reciterId);
  if (autoChecked.has(key)) return;
  autoChecked.add(key);
  void (async () => {
    if (useDownloads.getState().records[key]?.status) return;
    const cached = await getCachedBlob(surah, reciterId);
    if (cached) return;
    await useDownloads.getState().download(surah, reciterId);
  })();
}

/** تنزيل صريح من واجهة المستخدم مع تنبيهات */
export async function downloadSurahForOffline(
  surah: number,
  reciterId: string
): Promise<void> {
  const meta = SURAHS[surah - 1];
  if (!meta) return;
  const ok = await useDownloads.getState().download(surah, reciterId);
  if (ok) {
    toast(`تم حفظ سورة ${meta.name} — تُسمع الآن دون إنترنت`, "ok");
  } else {
    toast(`تعذّر تنزيل سورة ${meta.name}. تحقّق من الاتصال وحاول مجدداً.`, "error");
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return arDigits(0);
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${arDigits(mb.toFixed(1))} م.ب`;
  return `${arDigits(Math.max(1, Math.round(bytes / 1024)))} ك.ب`;
}
