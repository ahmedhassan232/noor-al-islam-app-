"use client";
// ===== المفضلة — كل محفوظاتك =====
import { useState } from "react";
import Link from "next/link";
import { Star, BookOpen, ScrollText, Sparkles, Heart, ChevronLeft } from "lucide-react";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { Chip } from "@/components/homebits";
import { SurahBadge } from "@/components/decor";
import { SURAHS } from "@/lib/data/surahs";
import { HADITHS } from "@/lib/data/hadiths";
import { getDhikr } from "@/lib/data/adhkar";
import { usePrefs } from "@/lib/services/prefsStore";
import { arDigits, cn } from "@/lib/utils";

type Tab = "surahs" | "ayahs" | "hadiths" | "adhkar";

export default function FavoritesPage() {
  const [tab, setTab] = useState<Tab>("surahs");
  const favSurahs = usePrefs((s) => s.favSurahs);
  const favAyahs = usePrefs((s) => s.favAyahs);
  const favHadiths = usePrefs((s) => s.favHadiths);
  const favDhikr = usePrefs((s) => s.favDhikr);
  const toggleFavSurah = usePrefs((s) => s.toggleFavSurah);
  const toggleFavHadith = usePrefs((s) => s.toggleFavHadith);
  const toggleFavDhikr = usePrefs((s) => s.toggleFavDhikr);
  const toggleFavAyah = usePrefs((s) => s.toggleFavAyah);

  const hadiths = HADITHS.filter((h) => favHadiths.includes(h.id));
  const dhikrs = favDhikr.map((id) => getDhikr(id)).filter(Boolean);

  return (
    <div>
      <PageHeader
        title="المفضلة"
        subtitle="السور والآيات والأحاديث والأذكار التي حفظتها"
        icon={<Star size={26} />}
      />

      <div className="flex gap-2 flex-wrap mb-7">
        <Chip active={tab === "surahs"} onClick={() => setTab("surahs")}>
          السور ({arDigits(favSurahs.length)})
        </Chip>
        <Chip active={tab === "ayahs"} onClick={() => setTab("ayahs")}>
          الآيات ({arDigits(favAyahs.length)})
        </Chip>
        <Chip active={tab === "hadiths"} onClick={() => setTab("hadiths")}>
          الأحاديث ({arDigits(hadiths.length)})
        </Chip>
        <Chip active={tab === "adhkar"} onClick={() => setTab("adhkar")}>
          الأذكار ({arDigits(dhikrs.length)})
        </Chip>
      </div>

      {/* السور */}
      {tab === "surahs" &&
        (favSurahs.length === 0 ? (
          <EmptyState
            title="لا سور مفضلة بعد"
            hint="من صفحة القرآن اضغط القلب لحفظ سورة هنا"
            icon={<BookOpen size={26} />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger">
            {[...favSurahs].sort((a, b) => a - b).map((n) => {
              const s = SURAHS[n - 1];
              return (
                <Card key={n} hover className="p-4">
                  <div className="flex items-center gap-3">
                    <SurahBadge n={n} size={46} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black">سورة {s.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {arDigits(s.ayahs)} آية • {s.type}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavSurah(n)}
                      className="icon-btn !w-9 !h-9"
                      aria-label="إزالة من المفضلة"
                    >
                      <Heart size={16} className="fill-[var(--danger)] text-[var(--danger)]" />
                    </button>
                    <Link href={`/quran/${n}`} className="icon-btn !w-9 !h-9" aria-label="فتح السورة">
                      <ChevronLeft size={17} />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {/* الآيات */}
      {tab === "ayahs" &&
        (favAyahs.length === 0 ? (
          <EmptyState
            title="لا آيات مفضلة بعد"
            hint="في صفحة السورة اضغط على آية ثم زر القلب"
            icon={<BookOpen size={26} />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 stagger">
            {favAyahs.map((key) => {
              const [s, a] = key.split(":").map(Number);
              const surah = SURAHS[s - 1];
              if (!surah || !a) return null;
              return (
                <Card key={key} hover className="p-5">
                  <div className="flex items-center gap-4">
                    <span className="grid place-items-center w-11 h-11 rounded-full border border-[var(--line-strong)] text-[var(--gold)] font-black shrink-0">
                      {arDigits(a)}
                    </span>
                    <div className="flex-1">
                      <p className="font-black">سورة {surah.name} — الآية {arDigits(a)}</p>
                      <p className="text-xs text-[var(--muted)]">اضغط لفتحها في المصحف</p>
                    </div>
                    <button
                      onClick={() => toggleFavAyah(key)}
                      className="icon-btn !w-9 !h-9"
                      aria-label="إزالة الآية من المفضلة"
                    >
                      <Heart size={16} className="fill-[var(--danger)] text-[var(--danger)]" />
                    </button>
                    <Link href={`/quran/${s}`} className="icon-btn !w-9 !h-9" aria-label="فتح السورة">
                      <ChevronLeft size={17} />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {/* الأحاديث */}
      {tab === "hadiths" &&
        (hadiths.length === 0 ? (
          <EmptyState
            title="لا أحاديث مفضلة بعد"
            hint="من مكتبة الأحاديث اضغط القلب لحفظ حديث"
            icon={<ScrollText size={26} />}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {hadiths.map((h) => (
              <Card key={h.id} className="p-6">
                <p className="text-lg leading-loose line-clamp-4" style={{ fontFamily: "var(--font-quran)" }}>
                  «{h.text}»
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {h.narrator} — {h.reference}
                </p>
                <button
                  onClick={() => toggleFavHadith(h.id)}
                  className="mt-3 text-xs font-bold text-[var(--danger)]"
                >
                  إزالة من المفضلة
                </button>
              </Card>
            ))}
          </div>
        ))}

      {/* الأذكار */}
      {tab === "adhkar" &&
        (dhikrs.length === 0 ? (
          <EmptyState
            title="لا أذكار مفضلة بعد"
            hint="من قسم الأذكار اضغط القلب لحفظ ذكر"
            icon={<Sparkles size={26} />}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {dhikrs.map(
              (entry) =>
                entry && (
                  <Card key={entry.dhikr.id} className="p-6">
                    <p className="text-xs font-bold text-[var(--gold)] mb-2">{entry.category.title}</p>
                    <p className="text-lg leading-loose line-clamp-3" style={{ fontFamily: "var(--font-quran)" }}>
                      {entry.dhikr.text}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{entry.dhikr.source}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href={`/adhkar?cat=${entry.category.id}`}
                        className="text-xs font-bold text-[var(--emerald)]"
                      >
                        فتح العدّاد
                      </Link>
                      <button
                        onClick={() => toggleFavDhikr(entry.dhikr.id)}
                        className="text-xs font-bold text-[var(--danger)]"
                      >
                        إزالة من المفضلة
                      </button>
                    </div>
                  </Card>
                )
            )}
          </div>
        ))}
    </div>
  );
}
