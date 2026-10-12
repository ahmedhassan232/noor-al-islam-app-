"use client";
// ===== المشغّل المصغّر — شريط سفلي ثابت =====
import { Pause, Play, X, Loader2, ChevronUp, AlertTriangle } from "lucide-react";
import { usePlayer } from "@/lib/services/playerStore";
import { getReciter } from "@/lib/data/audio";
import { formatDuration, cn } from "@/lib/utils";

export default function MiniPlayer() {
  const p = usePlayer();
  if (!p.track || p.status === "idle") return null;
  const isSurah = p.track.kind === "surah";
  const progress =
    isSurah && p.duration > 0 ? Math.min(1, p.currentTime / p.duration) : 0;

  const busy = p.status === "loading" || p.status === "buffering";

  return (
    <div
      className="fixed z-50 inset-x-3 md:inset-x-auto md:start-[296px] md:end-6 bottom-[76px] md:bottom-5 anim-pop"
      style={{ bottom: "calc(70px + env(safe-area-inset-bottom))" }}
    >
      <div className="card overflow-hidden !rounded-2xl shadow-2xl border-[var(--line-strong)]">
        {/* شريط التقدم العلوي — قابل للسحب بالنقر */}
        {isSurah && p.duration > 0 && (
          <input
            type="range"
            aria-label="موضع التلاوة"
            min={0}
            max={Math.floor(p.duration)}
            value={Math.floor(p.currentTime)}
            onChange={(e) => p.seek(Number(e.target.value))}
            className="w-full !h-[6px] !rounded-none block"
          />
        )}
        {!isSurah && (
          <div className="h-[6px] bg-[color-mix(in_srgb,var(--emerald)_30%,transparent)] relative overflow-hidden">
            <div className="absolute inset-0 skeleton" />
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* زر التشغيل */}
          <button
            onClick={() => p.toggle()}
            aria-label={p.status === "playing" ? "إيقاف مؤقت" : "تشغيل"}
            className={cn(
              "relative grid place-items-center w-11 h-11 rounded-full shrink-0 transition-transform active:scale-90",
              "bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white shadow-lg"
            )}
          >
            {busy && (
              <span className="absolute inset-0 rounded-full border-2 border-[var(--gold)] animate-[pulse-ring_1.4s_ease-out_infinite]" />
            )}
            {busy ? (
              <Loader2 size={20} className="animate-spin" />
            ) : p.status === "playing" ? (
              <Pause size={20} />
            ) : p.status === "error" ? (
              <AlertTriangle size={19} />
            ) : (
              <Play size={20} className="ms-0.5" />
            )}
          </button>

          {/* معلومات المقطع */}
          <button
            onClick={() => (p.status === "error" ? p.retry() : p.setFullOpen(true))}
            className="min-w-0 flex-1 text-start"
          >
            <p className="font-bold truncate leading-tight">
              {p.status === "error" ? "تعذّر التشغيل — اضغط لإعادة المحاولة" : p.track.title}
            </p>
            <p className="text-xs text-[var(--muted)] truncate">
              {isSurah
                ? p.error ??
                  `${p.sourceLabel === "المخزن المحلي" ? "محفوظ دون إنترنت • " : ""}${getReciter(p.reciterId).name} • ${formatDuration(p.currentTime)} / ${formatDuration(p.duration)}`
                : p.error ?? "بث مباشر"}
            </p>
          </button>

          <span className="hidden sm:block text-xs font-bold text-[var(--gold)] border border-[var(--line)] rounded-full px-2.5 py-1">
            {isSurah ? "تلاوة" : "إذاعة"}
          </span>
          <button
            onClick={() => p.setFullOpen(true)}
            className="icon-btn !w-9 !h-9"
            aria-label="فتح المشغّل الكامل"
          >
            <ChevronUp size={18} />
          </button>
          <button onClick={() => p.stop()} className="icon-btn !w-9 !h-9" aria-label="إغلاق المشغّل">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
