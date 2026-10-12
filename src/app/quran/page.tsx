"use client";
// ===== مكتبة القرآن الكريم — ١١٤ سورة =====
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Play, BookOpen, Heart } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";
import { SurahBadge } from "@/components/decor";
import { Card, Chip } from "@/components/homebits";
import DownloadButton from "@/components/audio/DownloadButton";
import { SURAHS } from "@/lib/data/surahs";
import { usePrefs } from "@/lib/services/prefsStore";
import { usePlayer } from "@/lib/services/playerStore";
import { arDigits, arabicIncludes, normalizeArabic, cn } from "@/lib/utils";
import { BookMarked } from "lucide-react";

type Filter = "all" | "مكية" | "مدنية" | "fav";

export default function QuranPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const favSurahs = usePrefs((s) => s.favSurahs);
  const toggleFavSurah = usePrefs((s) => s.toggleFavSurah);
  const readProgress = usePrefs((s) => s.readProgress);
  const playSurah = usePlayer((s) => s.playSurah);

  const list = useMemo(() => {
    const query = q.trim();
    const num = Number(query);
    return SURAHS.filter((s) => {
      if (filter === "fav" && !favSurahs.includes(s.n)) return false;
      if ((filter === "مكية" || filter === "مدنية") && s.type !== filter) return false;
      if (!query) return true;
      return (
        arabicIncludes(s.name, query) ||
        normalizeArabic(s.latin).includes(normalizeArabic(query)) ||
        (Number.isInteger(num) && num === s.n)
      );
    });
  }, [q, filter, favSurahs]);

  return (
    <div>
      <PageHeader
        title="القرآن الكريم"
        subtitle="المصحف كاملاً — ١١٤ سورة بالرسم العثماني، قراءةً واستماعاً"
        icon={<BookMarked size={26} />}
      />

      {/* البحث والتصفية */}
      <div className="sticky top-[68px] md:top-4 z-30 mb-6">
        <div className="card p-3 flex flex-col sm:flex-row gap-3 backdrop-blur-xl">
          <div className="relative flex-1">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-[var(--muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم… (الفاتحة، الكهف، 36)"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-11 py-2.5 font-semibold outline-none focus:border-[var(--ring)]"
              aria-label="بحث في السور"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>الكل</Chip>
            <Chip active={filter === "مكية"} onClick={() => setFilter("مكية")}>مكية</Chip>
            <Chip active={filter === "مدنية"} onClick={() => setFilter("مدنية")}>مدنية</Chip>
            <Chip active={filter === "fav"} onClick={() => setFilter("fav")}>المفضلة</Chip>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="لا توجد سور مطابقة"
          hint="جرّب اسماً آخر أو رقماً بين ١ و١١٤"
          icon={<BookOpen size={26} />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {list.map((s) => {
            const fav = favSurahs.includes(s.n);
            const prog = readProgress[s.n];
            return (
              <Card key={s.n} hover className="p-4 group">
                <div className="flex items-center gap-4">
                  <SurahBadge n={s.n} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black truncate">سورة {s.name}</h3>
                      <span className="text-[10px] font-bold text-[var(--gold)] border border-[var(--line)] rounded-full px-2 py-0.5 shrink-0">
                        {s.type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                      {s.latin} • {arDigits(s.ayahs)} آية
                      {prog ? ` • وصلت للآية ${arDigits(prog)}` : ""}
                    </p>
                    {prog && (
                      <div className="mt-2 h-1 rounded-full bg-[color-mix(in_srgb,var(--muted)_18%,transparent)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-[var(--gold)] to-[var(--emerald)]"
                          style={{ width: `${Math.min(100, (prog / s.ayahs) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => toggleFavSurah(s.n)}
                      className="icon-btn !w-9 !h-9"
                      aria-label={fav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    >
                      <Heart size={17} className={cn(fav && "fill-[var(--danger)] text-[var(--danger)]")} />
                    </button>
                    <button
                      onClick={() => playSurah(s.n)}
                      className="icon-btn !w-9 !h-9 !text-[var(--emerald)]"
                      aria-label={`استمع إلى سورة ${s.name}`}
                    >
                      <Play size={17} />
                    </button>
                    <DownloadButton surah={s.n} small />
                  </div>
                </div>
                <Link
                  href={`/quran/${s.n}`}
                  className="mt-3 btn btn-ghost w-full !py-2 text-sm"
                >
                  <BookOpen size={15} />
                  قراءة السورة
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
