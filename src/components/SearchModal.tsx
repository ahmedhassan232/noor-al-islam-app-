"use client";
// ===== البحث الشامل: السور، الأحاديث، الأذكار، الصفحات =====
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ScrollText, Sparkles, CornerDownLeft } from "lucide-react";
import { cn, normalizeArabic, arDigits } from "@/lib/utils";
import { SURAHS } from "@/lib/data/surahs";
import { HADITHS } from "@/lib/data/hadiths";
import { ADHKAR } from "@/lib/data/adhkar";
import { Modal } from "@/components/ui";

interface Result {
  key: string;
  type: "سورة" | "حديث" | "ذكر" | "صفحة";
  title: string;
  hint: string;
  href: string;
}

const PAGES: Result[] = [
  { key: "p1", type: "صفحة", title: "القرآن الكريم", hint: "المصحف كاملاً", href: "/quran" },
  { key: "p2", type: "صفحة", title: "الأحاديث النبوية", hint: "مكتبة موثقة", href: "/hadith" },
  { key: "p3", type: "صفحة", title: "الأذكار", hint: "صباح ومساء", href: "/adhkar" },
  { key: "p4", type: "صفحة", title: "مواقيت الصلاة", hint: "حساب محلي دقيق", href: "/prayer" },
  { key: "p5", type: "صفحة", title: "اتجاه القبلة", hint: "بوصلة تفاعلية", href: "/qibla" },
  { key: "p6", type: "صفحة", title: "الإذاعة الإسلامية", hint: "بث مباشر", href: "/radio" },
  { key: "p7", type: "صفحة", title: "المفضلة", hint: "محفوظاتك", href: "/favorites" },
  { key: "p8", type: "صفحة", title: "الإعدادات", hint: "الثيم والقارئ والمدينة", href: "/settings" },
];

const TYPE_ICON = { سورة: BookOpen, حديث: ScrollText, ذكر: Sparkles, صفحة: CornerDownLeft } as const;

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (open) {
      setQ("");
      setDebounced("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 140);
    return () => clearTimeout(t);
  }, [q]);

  const results = useMemo<Result[]>(() => {
    const query = debounced.trim();
    if (!query) return PAGES.slice(0, 4);
    const nq = normalizeArabic(query);
    const out: Result[] = [];
    // السور
    const num = Number(query);
    for (const s of SURAHS) {
      if (out.length >= 6) break;
      const hit =
        normalizeArabic(s.name).includes(nq) ||
        normalizeArabic(s.latin).includes(nq) ||
        (Number.isInteger(num) && s.n === num);
      if (hit) {
        out.push({
          key: `s${s.n}`,
          type: "سورة",
          title: `سورة ${s.name}`,
          hint: `${arDigits(s.ayahs)} آية — ${s.type}`,
          href: `/quran/${s.n}`,
        });
      }
    }
    // الأحاديث
    for (const h of HADITHS) {
      if (out.length >= 12) break;
      if (
        normalizeArabic(h.text).includes(nq) ||
        normalizeArabic(h.narrator).includes(nq) ||
        h.topics.some((t) => normalizeArabic(t).includes(nq))
      ) {
        out.push({
          key: h.id,
          type: "حديث",
          title: h.text.length > 90 ? h.text.slice(0, 90) + "…" : h.text,
          hint: `${h.narrator} — ${h.reference}`,
          href: `/hadith?q=${encodeURIComponent(query)}`,
        });
      }
    }
    // الأذكار
    for (const c of ADHKAR) {
      for (const d of c.items) {
        if (out.length >= 18) break;
        if (normalizeArabic(d.text).includes(nq) || normalizeArabic(c.title).includes(nq)) {
          out.push({
            key: d.id,
            type: "ذكر",
            title: d.text.length > 80 ? d.text.slice(0, 80) + "…" : d.text,
            hint: `${c.title} — ${d.source}`,
            href: `/adhkar?cat=${c.id}`,
          });
        }
      }
    }
    // الصفحات
    for (const p of PAGES) {
      if (normalizeArabic(p.title).includes(nq)) out.push(p);
    }
    return out;
  }, [debounced]);

  useEffect(() => setActive(0), [results.length]);

  const go = (r: Result) => {
    onClose();
    router.push(r.href);
  };

  return (
    <Modal open={open} onClose={onClose} title="البحث الشامل" wide>
      <div className="relative">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-[var(--muted)]" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && results[active]) {
              go(results[active]);
            }
          }}
          placeholder="ابحث عن سورة، حديث، ذكر…"
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--bg-2)] px-11 py-3.5 text-lg font-semibold outline-none focus:border-[var(--ring)]"
          aria-label="بحث شامل"
        />
      </div>

      <div className="mt-4 space-y-1.5 max-h-[46vh] overflow-y-auto pe-1">
        {results.length === 0 && (
          <p className="text-center text-[var(--muted)] py-8">
            لا نتائج مطابقة — جرّب كلمات أخرى
          </p>
        )}
        {results.map((r, i) => {
          const Icon = TYPE_ICON[r.type];
          return (
            <button
              key={r.key}
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "w-full flex items-center gap-3.5 rounded-2xl px-4 py-3 text-start transition-colors",
                i === active ? "bg-[color-mix(in_srgb,var(--emerald)_16%,transparent)] border border-[var(--line-strong)]" : "border border-transparent hover:bg-[var(--surface-2)]"
              )}
            >
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--gold)] shrink-0">
                <Icon size={17} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold leading-snug line-clamp-1">{r.title}</span>
                <span className="block text-xs text-[var(--muted)] mt-0.5 truncate">{r.hint}</span>
              </span>
              <span className="ms-auto text-[10px] font-bold text-[var(--gold)] border border-[var(--line)] rounded-full px-2 py-0.5 shrink-0">
                {r.type}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
