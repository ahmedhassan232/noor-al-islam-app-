"use client";
// ===== الأذكار والأدعية — عدّادات تفاعلية بحفظ يومي =====
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Heart,
  Undo2,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  Copy,
} from "lucide-react";
import { PageHeader, EmptyState, ProgressRing } from "@/components/ui";
import { Card } from "@/components/homebits";
import { ADHKAR, type Dhikr, type AdhkarCategory } from "@/lib/data/adhkar";
import { usePrefs } from "@/lib/services/prefsStore";
import { copyText } from "@/lib/services/toastStore";
import { arDigits, cn, localDateKey } from "@/lib/utils";
import { Sunrise, Sunset, MoonStar, BedDouble, AlarmClock, Globe, BookOpen, MessageCircleHeart } from "lucide-react";

const CAT_ICONS: Record<string, typeof Sunrise> = {
  morning: Sunrise,
  evening: Sunset,
  "after-prayer": MoonStar,
  sleep: BedDouble,
  waking: AlarmClock,
  general: Globe,
  "quran-duas": BookOpen,
  "prophet-duas": MessageCircleHeart,
};

function vibrate() {
  try {
    navigator.vibrate?.(18);
  } catch {
    /* غير مدعوم */
  }
}

function DhikrCard({ dhikr }: { dhikr: Dhikr }) {
  const today = localDateKey();
  const stored = usePrefs((s) => s.dhikrCounts[dhikr.id]);
  const setDhikrCount = usePrefs((s) => s.setDhikrCount);
  const fav = usePrefs((s) => s.favDhikr.includes(dhikr.id));
  const toggleFavDhikr = usePrefs((s) => s.toggleFavDhikr);

  const count = stored?.date === today ? stored.count : 0;
  const done = count >= dhikr.count;
  const remaining = Math.max(0, dhikr.count - count);

  const bump = () => {
    if (done) return;
    vibrate();
    setDhikrCount(dhikr.id, today, count + 1);
  };

  return (
    <Card className={cn("p-6 transition-all duration-500", done && "border-[color-mix(in_srgb,var(--ok)_45%,transparent)]")}>
      <p className="text-xl leading-[2.05]" style={{ fontFamily: "var(--font-quran)" }}>
        {dhikr.text}
      </p>
      <p className="mt-3 text-xs text-[var(--muted)]">{dhikr.source}</p>
      {dhikr.virtue && (
        <p className="mt-1.5 text-xs text-[var(--gold)]">✦ {dhikr.virtue}</p>
      )}

      <div className="mt-5 flex items-center gap-4">
        {/* العدّاد الكبير */}
        <button
          onClick={bump}
          disabled={done}
          aria-label={done ? "اكتمل الذكر" : `عدّ الذكر — المتبقي ${arDigits(remaining)}`}
          className={cn(
            "transition-transform active:scale-90 disabled:cursor-default",
            !done && "hover:scale-105"
          )}
        >
          <ProgressRing value={count / dhikr.count} size={92} stroke={7}>
            {done ? (
              <CheckCircle2 size={30} className="text-[var(--ok)]" />
            ) : (
              <span className="text-2xl font-black">{arDigits(remaining)}</span>
            )}
          </ProgressRing>
        </button>

        <div className="flex-1">
          <p className="font-bold">
            {done ? "ما شاء الله، اكتمل الذكر" : `التكرار: ${arDigits(dhikr.count)} ${dhikr.count === 1 ? "مرة" : "مرات"}`}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {done ? "تقبّل الله منك" : `أنجزت ${arDigits(count)} — اضغط الدائرة للعدّ`}
          </p>
          <div className="mt-3 flex gap-1">
            <button
              onClick={() => count > 0 && setDhikrCount(dhikr.id, today, count - 1)}
              className="icon-btn !w-9 !h-9"
              aria-label="تراجع خطوة"
              disabled={count === 0}
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={() => setDhikrCount(dhikr.id, today, 0)}
              className="icon-btn !w-9 !h-9"
              aria-label="تصفير العدّاد"
              disabled={count === 0}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => copyText(`${dhikr.text} — (${dhikr.source})`)}
              className="icon-btn !w-9 !h-9"
              aria-label="نسخ الذكر"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => toggleFavDhikr(dhikr.id)}
              className="icon-btn !w-9 !h-9"
              aria-label="تفضيل الذكر"
            >
              <Heart size={16} className={cn(fav && "fill-[var(--danger)] text-[var(--danger)]")} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AdhkarContent() {
  const params = useSearchParams();
  const [catId, setCatId] = useState<string | null>(params.get("cat"));
  const category: AdhkarCategory | undefined = ADHKAR.find((c) => c.id === catId);

  return (
    <div>
      <PageHeader
        title="الأذكار والأدعية"
        subtitle="حصن المسلم — أذكار موثقة بعدّادات تحفظ تقدّمك يومياً"
        icon={<Sparkles size={26} />}
      />

      {!category ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {ADHKAR.map((c) => {
            const Icon = CAT_ICONS[c.id] ?? Sparkles;
            return (
              <button key={c.id} onClick={() => setCatId(c.id)} className="text-start">
                <Card hover className="p-6 h-full">
                  <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white">
                    <Icon size={25} />
                  </span>
                  <p className="mt-4 text-xl font-black">{c.title}</p>
                  <p className="text-sm text-[var(--muted)] mt-1">{c.description}</p>
                  <p className="mt-3 text-xs font-bold text-[var(--gold)]">
                    {arDigits(c.items.length)} ذِكراً ودعاءً
                  </p>
                </Card>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="anim-fade">
          <button
            onClick={() => setCatId(null)}
            className="btn btn-ghost !py-2 mb-6 text-sm"
          >
            <ChevronLeft size={16} />
            كل الأقسام
          </button>
          <h2 className="text-2xl font-black mb-1">{category.title}</h2>
          <p className="text-[var(--muted)] mb-6">{category.description}</p>
          {category.items.length === 0 ? (
            <EmptyState title="لا عناصر" icon={<Sparkles size={24} />} />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {category.items.map((d) => (
                <DhikrCard key={d.id} dhikr={d} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdhkarPage() {
  return (
    <Suspense>
      <AdhkarContent />
    </Suspense>
  );
}
