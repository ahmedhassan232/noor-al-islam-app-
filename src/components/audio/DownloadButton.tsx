"use client";
// ===== زر تنزيل سورة للاستماع دون إنترنت =====
import { DownloadCloud, CloudCheck, Loader2 } from "lucide-react";
import {
  useDownloads,
  downloadSurahForOffline,
  audioKey,
} from "@/lib/services/offlineAudio";
import { usePrefs } from "@/lib/services/prefsStore";
import { arDigits, cn } from "@/lib/utils";

export default function DownloadButton({
  surah,
  reciterId,
  small = false,
}: {
  surah: number;
  reciterId?: string;
  small?: boolean;
}) {
  const prefReciter = usePrefs((s) => s.reciterId);
  const rid = reciterId ?? prefReciter;
  const key = audioKey(surah, rid);
  const record = useDownloads((s) => s.records[key]);

  const done = record?.status === "done";
  const busy = record?.status === "downloading";
  const pct = busy ? Math.round((record?.progress ?? 0) * 100) : 0;

  const label = done
    ? "محفوظة — تُسمع دون إنترنت (اضغط للمزيد)"
    : busy
      ? `جاري التنزيل ${arDigits(pct)}٪`
      : "تنزيل للاستماع دون إنترنت";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!busy && !done) void downloadSurahForOffline(surah, rid);
      }}
      disabled={busy}
      aria-label={label}
      title={label}
      className={cn(
        "icon-btn relative",
        small && "!w-9 !h-9",
        done && "!text-[var(--ok)]",
        busy && "cursor-wait"
      )}
    >
      {busy ? (
        <>
          <Loader2 size={17} className="animate-spin" />
          <span className="absolute -bottom-1 -end-1 text-[9px] font-black text-[var(--gold)] bg-[var(--surface)] rounded-full px-1 border border-[var(--line)]">
            {arDigits(pct)}
          </span>
        </>
      ) : done ? (
        <CloudCheck size={17} />
      ) : (
        <DownloadCloud size={17} />
      )}
    </button>
  );
}
