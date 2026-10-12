"use client";
// ===== المشغّل الكامل — نافذة شاملة بكل عناصر التحكم =====
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Loader2,
  Heart,
  RefreshCw,
  Gauge,
  User,
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui";
import { SurahBadge } from "@/components/decor";
import DownloadButton from "@/components/audio/DownloadButton";
import { usePlayer, type RepeatMode } from "@/lib/services/playerStore";
import { RECITERS } from "@/lib/data/audio";
import { SURAHS } from "@/lib/data/surahs";
import { usePrefs } from "@/lib/services/prefsStore";
import { formatDuration, arDigits, cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function FullPlayer() {
  const p = usePlayer();
  const open = p.fullOpen;
  const close = () => p.setFullOpen(false);
  const favSurahs = usePrefs((s) => s.favSurahs);
  const toggleFavSurah = usePrefs((s) => s.toggleFavSurah);

  if (!open) return null;
  const track = p.track;
  const isSurah = track?.kind === "surah";
  const surahNum = isSurah ? track.surah : 0;
  const meta = surahNum ? SURAHS[surahNum - 1] : null;
  const busy = p.status === "loading" || p.status === "buffering";
  const isFav = surahNum ? favSurahs.includes(surahNum) : false;

  const repeatMode: RepeatMode = p.repeat;
  const nextRepeat = () =>
    p.setRepeat(repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off");

  return (
    <Modal open={open} onClose={close} title="المشغّل" wide>
      {!track ? (
        <div className="text-center py-8">
          <p className="text-[var(--muted)] mb-6">لم يتم اختيار مقطع بعد</p>
          <Link href="/quran" onClick={close} className="btn btn-primary">
            تصفّح المصحف
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* بطاقة المقطع */}
          <div className="flex items-center gap-4">
            {isSurah ? (
              <SurahBadge n={surahNum} size={64} active={p.status === "playing"} />
            ) : (
              <div className="w-16 h-16 grid place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--emerald)_16%,transparent)] text-[var(--gold)] border border-[var(--line)]">
                <span className={cn("w-2.5 h-2.5 rounded-full bg-[var(--danger)]", p.status === "playing" && "animate-pulse")} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-2xl font-black">{track.title}</h3>
              <p className="text-[var(--muted)]">
                {isSurah
                  ? `${getReciterName(p.reciterId)} • ${meta ? `${arDigits(meta.ayahs)} آية • ${meta.type}` : ""}`
                  : "بث إذاعي مباشر"}
              </p>
              {p.sourceLabel && p.status === "loading" && (
                <p className="text-xs text-[var(--gold)] mt-1">جاري التحميل من {p.sourceLabel}…</p>
              )}
            </div>
            {isSurah && (
              <div className="ms-auto flex items-center gap-1">
                <DownloadButton surah={surahNum} reciterId={p.reciterId} />
                <button
                  onClick={() => toggleFavSurah(surahNum)}
                  className="icon-btn"
                  aria-label="إضافة السورة للمفضلة"
                >
                  <Heart
                    size={22}
                    className={isFav ? "fill-[var(--danger)] text-[var(--danger)]" : ""}
                  />
                </button>
              </div>
            )}
          </div>

          {/* شارة العمل دون إنترنت */}
          {isSurah && p.sourceLabel === "المخزن المحلي" && (
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ok)] bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] border border-[color-mix(in_srgb,var(--ok)_35%,transparent)] rounded-xl px-3.5 py-2">
              <span className="w-2 h-2 rounded-full bg-[var(--ok)]" />
              تُشغَّل من جهازك — تعمل دون اتصال بالإنترنت
            </div>
          )}

          {/* حالة الخطأ */}
          {p.status === "error" && (
            <div className="card !border-[color-mix(in_srgb,var(--danger)_40%,transparent)] p-4 flex items-center gap-3">
              <p className="text-sm flex-1 text-[var(--danger)]">{p.error}</p>
              <button onClick={() => p.retry()} className="btn btn-ghost !py-2 !px-4 text-sm">
                <RefreshCw size={15} /> إعادة
              </button>
            </div>
          )}

          {/* شريط التقدم */}
          {isSurah ? (
            <div>
              <input
                type="range"
                aria-label="شريط التقدم"
                className="w-full"
                min={0}
                max={Math.max(1, Math.floor(p.duration))}
                value={Math.floor(Math.min(p.currentTime, p.duration || 0))}
                onChange={(e) => p.seek(Number(e.target.value))}
                disabled={!p.duration}
              />
              <div className="flex justify-between text-xs font-bold text-[var(--muted)] mt-1.5" dir="ltr">
                <span>{formatDuration(p.currentTime)}</span>
                <span>{formatDuration(p.duration)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span className={cn("w-2 h-2 rounded-full", p.status === "playing" ? "bg-[var(--danger)] animate-pulse" : "bg-[var(--muted)]")} />
              {p.status === "playing" ? "يبث الآن مباشرة" : p.status === "loading" ? "جاري الاتصال بالبث…" : "متوقف"}
            </div>
          )}

          {/* أزرار التحكم الرئيسية */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {isSurah && (
              <button
                onClick={nextRepeat}
                className="icon-btn"
                aria-label="وضع التكرار"
                title={repeatMode === "off" ? "بدون تكرار" : repeatMode === "all" ? "تكرار المتتالية" : "تكرار السورة"}
              >
                {repeatMode === "one" ? (
                  <Repeat1 size={20} className="text-[var(--gold)]" />
                ) : (
                  <Repeat size={20} className={repeatMode === "all" ? "text-[var(--gold)]" : ""} />
                )}
              </button>
            )}
            {isSurah && (
              <button
                onClick={() => p.prev()}
                className="icon-btn"
                aria-label="السورة السابقة"
                disabled={surahNum <= 1}
              >
                <SkipForward size={21} />
              </button>
            )}
            {isSurah && (
              <button onClick={() => p.seekBy(-15)} className="icon-btn" aria-label="رجوع ١٥ ثانية">
                <RotateCw size={19} />
              </button>
            )}
            <button
              onClick={() => p.toggle()}
              aria-label={p.status === "playing" ? "إيقاف مؤقت" : "تشغيل"}
              className="relative grid place-items-center w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white shadow-xl transition-transform active:scale-90"
            >
              {busy && (
                <span className="absolute inset-0 rounded-full border-2 border-[var(--gold)] animate-[pulse-ring_1.4s_ease-out_infinite]" />
              )}
              {busy ? (
                <Loader2 size={30} className="animate-spin" />
              ) : p.status === "playing" ? (
                <Pause size={30} />
              ) : (
                <Play size={30} className="ms-1" />
              )}
            </button>
            {isSurah && (
              <button onClick={() => p.seekBy(15)} className="icon-btn" aria-label="تقديم ١٥ ثانية">
                <RotateCcw size={19} />
              </button>
            )}
            {isSurah && (
              <button
                onClick={() => p.next()}
                className="icon-btn"
                aria-label="السورة التالية"
                disabled={surahNum >= SURAHS.length}
              >
                <SkipBack size={21} />
              </button>
            )}
            <button
              onClick={() => p.toggleMute()}
              className="icon-btn"
              aria-label={p.muted ? "إلغاء كتم الصوت" : "كتم الصوت"}
            >
              {p.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          {/* مستوى الصوت */}
          <div className="flex items-center gap-3">
            <Volume2 size={17} className="text-[var(--muted)] shrink-0" />
            <input
              type="range"
              aria-label="مستوى الصوت"
              className="flex-1"
              min={0}
              max={100}
              value={Math.round(p.volume * 100)}
              onChange={(e) => p.setVolume(Number(e.target.value) / 100)}
            />
            <span className="text-xs font-bold text-[var(--muted)] w-9 text-end">
              {arDigits(Math.round(p.volume * 100))}٪
            </span>
          </div>

          {/* سرعة التلاوة */}
          {isSurah && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] mb-2.5">
                <Gauge size={15} /> سرعة التلاوة
              </h4>
              <div className="flex gap-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => p.setRate(s)}
                    className={cn(
                      "flex-1 rounded-xl border py-2 text-sm font-bold transition-all",
                      p.rate === s
                        ? "border-[var(--gold)] text-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_12%,transparent)]"
                        : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)]"
                    )}
                  >
                    {arDigits(s)}×
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* اختيار القارئ */}
          {isSurah && (
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] mb-2.5">
                <User size={15} /> القارئ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RECITERS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => p.setReciterLive(r.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-start transition-all",
                      p.reciterId === r.id
                        ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_10%,transparent)]"
                        : "border-[var(--line)] hover:border-[var(--line-strong)]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-3 h-3 rounded-full border-2 transition-colors",
                        p.reciterId === r.id ? "bg-[var(--gold)] border-[var(--gold)]" : "border-[var(--muted)]"
                      )}
                    />
                    <span className="font-bold">{r.name}</span>
                    <span className="ms-auto text-xs text-[var(--muted)]">{r.style}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {isSurah && surahNum > 0 && (
            <Link
              href={`/quran/${surahNum}`}
              onClick={close}
              className="btn btn-ghost w-full"
            >
              فتح صفحة السورة للمتابعة والقراءة
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}

function getReciterName(id: string) {
  return RECITERS.find((r) => r.id === id)?.name ?? "";
}
