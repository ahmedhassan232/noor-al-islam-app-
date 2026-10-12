"use client";
// ===== مكتبة الأحاديث النبوية =====
import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ScrollText,
  Heart,
  Copy,
  Share2,
  BadgeCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";
import { Card, Chip } from "@/components/homebits";
import {
  HADITHS,
  HADITH_TOPICS,
  HADITH_COLLECTIONS,
  searchHadiths,
  type Hadith,
} from "@/lib/data/hadiths";
import { usePrefs } from "@/lib/services/prefsStore";
import { copyText, shareText } from "@/lib/services/toastStore";
import { arDigits, cn, pickDaily } from "@/lib/utils";

function HadithCard({ h }: { h: Hadith }) {
  const fav = usePrefs((s) => s.favHadiths.includes(h.id));
  const toggleFavHadith = usePrefs((s) => s.toggleFavHadith);
  return (
    <Card className="p-6 anim-rise">
      <p
        className="text-xl leading-[2.1]"
        style={{ fontFamily: "var(--font-quran)" }}
      >
        «{h.text}»
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-[var(--gold)]">الراوي: {h.narrator}</span>
        <span className="text-[var(--muted)]">•</span>
        <span className="text-[var(--muted)]">{h.reference}</span>
        <span
          className={cn(
            "ms-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
            h.grade === "صحيح"
              ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] text-[var(--ok)]"
              : "border-[color-mix(in_srgb,var(--gold)_45%,transparent)] text-[var(--gold)]"
          )}
        >
          <BadgeCheck size={13} />
          {h.grade}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {h.topics.map((t) => (
          <span key={t} className="text-[11px] font-bold text-[var(--muted)] bg-[var(--surface-2)] rounded-full px-2.5 py-1">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--line)] flex gap-1">
        <button
          onClick={() => toggleFavHadith(h.id)}
          className="icon-btn !w-10 !h-10"
          aria-label="تفضيل الحديث"
        >
          <Heart size={17} className={cn(fav && "fill-[var(--danger)] text-[var(--danger)]")} />
        </button>
        <button
          onClick={() => copyText(`«${h.text}» — ${h.narrator} (${h.reference})`)}
          className="icon-btn !w-10 !h-10"
          aria-label="نسخ الحديث"
        >
          <Copy size={17} />
        </button>
        <button
          onClick={() =>
            shareText(`حديث نبوي — ${h.reference}`, `«${h.text}» — رواه ${h.narrator}، ${h.reference}`)
          }
          className="icon-btn !w-10 !h-10"
          aria-label="مشاركة الحديث"
        >
          <Share2 size={17} />
        </button>
      </div>
    </Card>
  );
}

function HadithLibrary() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(q);
  const [topic, setTopic] = useState("");
  const [collection, setCollection] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);
  const favHadiths = usePrefs((s) => s.favHadiths);
  const [daily, setDaily] = useState<Hadith | undefined>(undefined);

  useEffect(() => {
    setDaily(pickDaily(HADITHS));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 160);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let list = HADITHS;
    if (onlyFav) list = list.filter((h) => favHadiths.includes(h.id));
    return searchHadiths(list, debounced, topic, collection);
  }, [debounced, topic, collection, onlyFav, favHadiths]);

  const [random, setRandom] = useState<Hadith | null>(null);
  const draw = () =>
    setRandom(HADITHS[Math.floor(Math.random() * HADITHS.length)]);

  return (
    <div>
      <PageHeader
        title="الأحاديث النبوية"
        subtitle={`${arDigits(HADITHS.length)} حديثاً موثقاً من كتب السنة المعتمدة بنصوصها ومخارجها`}
        icon={<ScrollText size={26} />}
      />

      {/* حديث اليوم والسحب */}
      <div className="grid md:grid-cols-2 gap-4 mb-8 anim-rise">
        {daily && (
          <Card className="p-6 relative overflow-hidden">
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-[color-mix(in_srgb,var(--gold)_10%,transparent)] blur-xl" />
            <p className="flex items-center gap-2 text-[var(--gold)] font-bold text-sm mb-3">
              <Sparkles size={15} /> حديث اليوم
            </p>
            <p className="text-lg leading-loose" style={{ fontFamily: "var(--font-quran)" }}>
              «{daily.text}»
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">{daily.reference}</p>
          </Card>
        )}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="flex items-center gap-2 text-[var(--emerald)] font-bold text-sm">
              <RotateCcw size={15} /> حديث عشوائي
            </p>
            <button onClick={draw} className="btn btn-ghost !py-1.5 !px-4 text-sm">
              اسحب حديثاً
            </button>
          </div>
          {random ? (
            <>
              <p className="text-lg leading-loose" style={{ fontFamily: "var(--font-quran)" }}>
                «{random.text}»
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">{random.reference}</p>
            </>
          ) : (
            <p className="text-[var(--muted)] my-auto text-center">
              اضغط «اسحب حديثاً» لعرض حديث موثق من المكتبة
            </p>
          )}
        </Card>
      </div>

      {/* البحث والتصفية */}
      <div className="card p-4 mb-6 space-y-3 sticky top-[68px] md:top-4 z-30 backdrop-blur-xl">
        <div className="relative">
          <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في النص أو الراوي أو الموضوع…"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-11 py-3 font-semibold outline-none focus:border-[var(--ring)]"
            aria-label="بحث في الأحاديث"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip active={topic === ""} onClick={() => setTopic("")}>كل المواضيع</Chip>
          {HADITH_TOPICS.map((t) => (
            <Chip key={t} active={topic === t} onClick={() => setTopic(topic === t ? "" : t)}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Chip active={collection === ""} onClick={() => setCollection("")}>كل المصادر</Chip>
          {HADITH_COLLECTIONS.map((c) => (
            <Chip key={c} active={collection === c} onClick={() => setCollection(collection === c ? "" : c)}>
              {c}
            </Chip>
          ))}
          <Chip active={onlyFav} onClick={() => setOnlyFav(!onlyFav)}>المفضلة فقط</Chip>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)] mb-4 font-bold">
        {arDigits(filtered.length)} نتيجة
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="لا توجد أحاديث مطابقة"
          hint="جرّب كلمات مختلفة أو أزل بعض المرشّحات"
          icon={<Search size={26} />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((h) => (
            <HadithCard key={h.id} h={h} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HadithPage() {
  return (
    <Suspense>
      <HadithLibrary />
    </Suspense>
  );
}
