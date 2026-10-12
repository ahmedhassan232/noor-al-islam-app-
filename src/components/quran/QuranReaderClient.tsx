"use client";
// ===== قارئ السورة — الرسم العثماني بعرض مصحفي =====
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Heart,
  Copy,
  Share2,
  ZoomIn,
  ZoomOut,
  Loader2,
  CloudOff,
  RefreshCw,
  History,
} from "lucide-react";
import { Card } from "@/components/homebits";
import { SurahBadge, Ornament } from "@/components/decor";
import { Skeleton } from "@/components/ui";
import DownloadButton from "@/components/audio/DownloadButton";
import { getSurah, SURAHS } from "@/lib/data/surahs";
import { getSurahText, splitBasmala, type SurahContent } from "@/lib/services/quranApi";
import { usePrefs } from "@/lib/services/prefsStore";
import { usePlayer } from "@/lib/services/playerStore";
import { arDigits, cn } from "@/lib/utils";
import { copyText, shareText } from "@/lib/services/toastStore";

const BASMALA = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";

export default function QuranReaderClient({ n }: { n: number }) {
  return <Reader n={n} />;
}

function Reader({ n }: { n: number }) {
  const meta = getSurah(n)!;
  const [content, setContent] = useState<SurahContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fontScale = usePrefs((s) => s.fontScale);
  const setFontScale = usePrefs((s) => s.setFontScale);
  const favAyahs = usePrefs((s) => s.favAyahs);
  const toggleFavAyah = usePrefs((s) => s.toggleFavAyah);
  const readProgress = usePrefs((s) => s.readProgress);
  const setLastRead = usePrefs((s) => s.setLastRead);
  const setReadProgress = usePrefs((s) => s.setReadProgress);

  const player = usePlayer();
  const isThisPlaying =
    player.track?.kind === "surah" &&
    player.track.surah === n &&
    (player.status === "playing" || player.status === "buffering");

  const load = () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setError(null);
    setContent(null);
    getSurahText(n, ctrl.signal)
      .then((c) => {
        if (!ctrl.signal.aborted) setContent(c);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "تعذّر تحميل نص السورة. تحقّق من اتصالك بالإنترنت."
          );
      });
  };

  useEffect(() => {
    load();
    setSelected(null);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const markRead = (ayah: number) => {
    setLastRead({ surah: n, ayah, at: Date.now() });
    setReadProgress(n, ayah);
    setSelected(selected === ayah ? null : ayah);
  };

  const resumeAyah = readProgress[n];
  const selectedText =
    content?.ayahs.find((a) => a.numberInSurah === selected)?.text ?? "";

  return (
    <div className="max-w-3xl mx-auto">
      {/* ترويسة السورة */}
      <Card className="p-6 md:p-8 mb-6 relative overflow-hidden anim-rise">
        <div className="absolute inset-0 opacity-[0.06] geo-pattern" />
        <div className="relative flex flex-wrap items-center gap-5">
          <SurahBadge n={n} size={68} />
          <div className="flex-1 min-w-[180px]">
            <h1 className="text-3xl md:text-4xl font-black">سورة {meta.name}</h1>
            <p className="text-[var(--muted)] mt-1">
              {meta.latin} • {meta.type} • {arDigits(meta.ayahs)} آية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (isThisPlaying ? player.pause() : player.playSurah(n))}
              className="btn btn-primary"
            >
              {player.track?.kind === "surah" && player.track.surah === n && player.status === "loading" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isThisPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
              {isThisPlaying ? "إيقاف" : "استماع"}
            </button>
          </div>
        </div>

        {/* أدوات */}
        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFontScale(fontScale - 0.1)}
            className="icon-btn !w-10 !h-10 border border-[var(--line)]"
            aria-label="تصغير الخط"
          >
            <ZoomOut size={18} />
          </button>
            <button
              onClick={() => setFontScale(fontScale + 0.1)}
              className="icon-btn !w-10 !h-10 border border-[var(--line)]"
              aria-label="تكبير الخط"
            >
              <ZoomIn size={18} />
            </button>
            <span className="border border-[var(--line)] rounded-[13px] grid place-items-center">
              <DownloadButton surah={n} />
            </span>
          {resumeAyah && (
            <span className="ms-auto flex items-center gap-1.5 text-xs font-bold text-[var(--gold)]">
              <History size={14} />
              آخر موضع: الآية {arDigits(resumeAyah)}
            </span>
          )}
        </div>
      </Card>

      {/* التنقل بين السور */}
      <div className="flex items-center justify-between mb-6 anim-fade">
        {n > 1 ? (
          <Link href={`/quran/${n - 1}`} className="btn btn-ghost !py-2 text-sm">
            <ChevronRight size={16} />
            {SURAHS[n - 2].name}
          </Link>
        ) : <span />}
        {n < SURAHS.length && (
          <Link href={`/quran/${n + 1}`} className="btn btn-ghost !py-2 text-sm">
            {SURAHS[n].name}
            <ChevronLeft size={16} />
          </Link>
        )}
      </div>

      {/* البسملة */}
      {n !== 9 && (
        <p
          className="text-center my-8 text-[var(--gold)] anim-fade"
          style={{ fontFamily: "var(--font-quran)", fontSize: "2rem" }}
        >
          {BASMALA}
        </p>
      )}

      {/* متن السورة */}
      {error && (
        <Card className="p-10 text-center border-[color-mix(in_srgb,var(--danger)_35%,transparent)]">
          <CloudOff className="mx-auto text-[var(--danger)]" size={38} />
          <p className="mt-4 font-bold text-lg">{error}</p>
          <p className="text-[var(--muted)] mt-2 text-sm">
            النص يُجلب من مصدر موثق (AlQuran Cloud — رسم عثماني) ويُحفظ على جهازك
            للقراءة لاحقاً دون اتصال.
          </p>
          <button onClick={load} className="btn btn-ghost mt-6">
            <RefreshCw size={17} />
            إعادة المحاولة
          </button>
        </Card>
      )}

      {!content && !error && (
        <div className="space-y-5">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      )}

      {content && (
        <Card className="p-6 md:p-10 anim-fade">
          <p
            className="quran-text"
            style={{ ["--quran-scale" as string]: fontScale }}
          >
            {content.ayahs.map((a, i) => {
              const text = i === 0 ? splitBasmala(n, a.text) : a.text;
              const isSel = selected === a.numberInSurah;
              const key = `${n}:${a.numberInSurah}`;
              const isFav = favAyahs.includes(key);
              return (
                <span key={a.numberInSurah}>
                  <span
                    onClick={() => markRead(a.numberInSurah)}
                    className={cn(
                      "cursor-pointer rounded-md transition-colors duration-300 hover:bg-[color-mix(in_srgb,var(--gold)_10%,transparent)]",
                      isSel && "bg-[color-mix(in_srgb,var(--gold)_16%,transparent)]",
                      isFav && "text-[var(--gold)]"
                    )}
                  >
                    {text}
                  </span>
                  <span className="ayah-mark" onClick={() => markRead(a.numberInSurah)}>
                    {arDigits(a.numberInSurah)}
                  </span>
                </span>
              );
            })}
          </p>

          {/* شريط إجراءات الآية المحددة */}
          {selected !== null && (
            <div className="sticky bottom-24 md:bottom-6 mt-6 card !bg-[var(--surface-2)] border-[var(--line-strong)] p-3 flex items-center gap-2 anim-pop shadow-xl">
              <span className="text-sm font-bold text-[var(--gold)] border border-[var(--line)] rounded-full px-3 py-1">
                الآية {arDigits(selected)}
              </span>
              <div className="flex gap-1 ms-auto">
                <button
                  className="icon-btn !w-10 !h-10"
                  aria-label="نسخ الآية"
                  onClick={() => copyText(`﴿${selectedText}﴾ [${meta.name}: ${arDigits(selected)}]`)}
                >
                  <Copy size={17} />
                </button>
                <button
                  className="icon-btn !w-10 !h-10"
                  aria-label="مشاركة الآية"
                  onClick={() =>
                    shareText(`سورة ${meta.name} — الآية ${arDigits(selected)}`, `﴿${selectedText}﴾`)
                  }
                >
                  <Share2 size={17} />
                </button>
                <button
                  className="icon-btn !w-10 !h-10"
                  aria-label="تفضيل الآية"
                  onClick={() => toggleFavAyah(`${n}:${selected}`)}
                >
                  <Heart
                    size={17}
                    className={cn(favAyahs.includes(`${n}:${selected}`) && "fill-[var(--danger)] text-[var(--danger)]")}
                  />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Ornament className="mt-10" />
    </div>
  );
}
