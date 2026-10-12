"use client";
// ===== الصفحة الرئيسية =====
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Headphones,
  ScrollText,
  Sparkles,
  MoonStar,
  Compass,
  Radio,
  Star,
  Play,
  RotateCcw,
  ChevronLeft,
  Sunrise,
  Sunset,
} from "lucide-react";
import { Card, OrnamentLite, SectionTitle } from "@/components/homebits";
import { Logo, SpinningStar } from "@/components/decor";
import { usePrefs } from "@/lib/services/prefsStore";
import { usePlayer } from "@/lib/services/playerStore";
import { HADITHS } from "@/lib/data/hadiths";
import { SURAHS } from "@/lib/data/surahs";
import { getReciter } from "@/lib/data/audio";
import { CITIES, getNextPrayer } from "@/lib/services/prayer";
import {
  arDigits,
  formatCountdown,
  formatDuration,
  gregorianDate,
  hijriDate,
  pickDaily,
} from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h >= 4 && h < 12) return "صباح النور والسكينة";
  if (h >= 12 && h < 17) return "طاب يومك بطاعة الله";
  if (h >= 17 && h < 21) return "مساء الطمأنينة";
  return "ليلة هادئة بذكر الله";
}

function NextPrayerCard() {
  const cityId = usePrefs((s) => s.cityId);
  const method = usePrefs((s) => s.calcMethod);
  // null = لم يُركَّب بعد: نفس المخرجات على الخادم والعميل (لا تعارض ترطيب)
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];
  const info = useMemo(
    () => (now ? getNextPrayer(city.lat, city.lng, method, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city.lat, city.lng, method, now ? Math.floor(now.getTime() / 30000) : 0]
  );
  // قيمة العدّاد لا تكون سالبة أبداً
  const remaining =
    info && now ? Math.max(0, info.at.getTime() - now.getTime()) : null;
  return (
    <Link href="/prayer" className="block">
      <Card hover className="p-6 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[color-mix(in_srgb,var(--emerald)_14%,transparent)] blur-2xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-[color-mix(in_srgb,var(--emerald)_18%,transparent)] text-[var(--gold)]">
              <MoonStar size={21} />
            </span>
            <div>
              <p className="text-sm text-[var(--muted)]">الصلاة القادمة — {city.name}</p>
              {info ? (
                <p className="text-2xl font-black">{info.name}</p>
              ) : (
                <div className="skeleton h-7 w-20 mt-1" aria-hidden="true" />
              )}
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs text-[var(--muted)]">يتبقى</p>
            {remaining !== null ? (
              <p className="text-xl font-black text-[var(--gold)] tabular-nums" dir="ltr">
                {formatCountdown(remaining)}
              </p>
            ) : (
              <div className="skeleton h-6 w-24 mt-1 ms-auto" aria-hidden="true" />
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ContinueJourney() {
  const lastRead = usePrefs((s) => s.lastRead);
  const lastPlayed = usePrefs((s) => s.lastPlayed);
  const reciterId = usePrefs((s) => s.reciterId);
  const playSurah = usePlayer((s) => s.playSurah);
  if (!lastRead && !lastPlayed) return null;
  const surah = lastRead ? SURAHS[lastRead.surah - 1] : null;
  const played = lastPlayed ? SURAHS[lastPlayed.surah - 1] : null;
  return (
    <section className="mt-10">
      <SectionTitle title="واصل رحلتك" />
      <div className="grid gap-4 md:grid-cols-2">
        {surah && lastRead && (
          <Link href={`/quran/${lastRead.surah}`}>
            <Card hover className="p-6">
              <div className="flex items-center gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] text-[var(--gold)] border border-[var(--line)]">
                  <BookOpen size={22} />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-[var(--muted)]">آخر قراءة</p>
                  <p className="text-xl font-black">
                    سورة {surah.name} — الآية {arDigits(lastRead.ayah)}
                  </p>
                </div>
                <ChevronLeft className="text-[var(--muted)]" size={20} />
              </div>
            </Card>
          </Link>
        )}
        {played && lastPlayed && (
          <Card hover className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--emerald)_16%,transparent)] text-[var(--emerald)] border border-[var(--line)]">
                <Headphones size={22} />
              </span>
              <div className="flex-1">
                <p className="text-sm text-[var(--muted)]">
                  آخر استماع — {getReciter(reciterId).name}
                </p>
                <p className="text-xl font-black">
                  سورة {played.name}
                  <span className="text-sm font-bold text-[var(--muted)]">
                    {" "}
                    عند {formatDuration(lastPlayed.position)}
                  </span>
                </p>
              </div>
              <button
                onClick={() =>
                  playSurah(lastPlayed.surah, { resumeAt: lastPlayed.position })
                }
                className="btn btn-primary !px-4 !py-2.5"
                aria-label="استئناف الاستماع"
              >
                <RotateCcw size={17} />
                استئناف
              </button>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}

const QUICK = [
  { href: "/quran", label: "القرآن الكريم", desc: "١١٤ سورة — قراءة وتلاوة", icon: BookOpen },
  { href: "/hadith", label: "الأحاديث النبوية", desc: "١٠٠ حديث موثق", icon: ScrollText },
  { href: "/adhkar", label: "الأذكار", desc: "صباح ومساء وأدعية", icon: Sparkles },
  { href: "/prayer", label: "مواقيت الصلاة", desc: "حساب دقيق محلياً", icon: MoonStar },
  { href: "/qibla", label: "اتجاه القبلة", desc: "بوصلة تفاعلية", icon: Compass },
  { href: "/radio", label: "الإذاعة الإسلامية", desc: "بث مباشر موثق", icon: Radio },
  { href: "/favorites", label: "المفضلة", desc: "محفوظاتك كلها", icon: Star },
];

export default function HomePage() {
  const playSurah = usePlayer((s) => s.playSurah);
  // بوابة التركيب: كل ما يعتمد على تاريخ/ساعة الجهاز يظهر بعد التركيب فقط
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dailyHadith = useMemo(
    () => (mounted ? pickDaily(HADITHS) : undefined),
    [mounted]
  );
  const hour = mounted ? new Date().getHours() : 12;
  const isMorning = hour >= 4 && hour < 16;
  return (
    <div className="space-y-10">
      {/* ===== البطل ===== */}
      <section className="anim-rise relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-gradient-to-bl from-[var(--bg-2)] via-[var(--surface)] to-[var(--bg-2)] p-7 md:p-12">
        <SpinningStar className="absolute -top-16 -left-16 w-72 h-72" />
        <SpinningStar className="absolute -bottom-20 -right-10 w-56 h-56 opacity-[0.07]" />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <div className="flex items-center gap-3 text-[var(--muted)] text-sm font-bold min-h-6">
              {mounted ? (
                <>
                  <span>{gregorianDate()}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                  <span className="text-[var(--gold)]">{hijriDate()}</span>
                </>
              ) : (
                <span className="skeleton h-4 w-64" aria-hidden="true" />
              )}
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.15]">
              {mounted ? greeting() : "أهلاً بك في رحاب الإيمان"}
              <span className="block mt-2 gold-text" style={{ fontFamily: "var(--font-kufi)" }}>
                بسم الله نبدأ يوماً جديداً
              </span>
            </h1>
            <p className="mt-4 text-[var(--muted)] text-lg leading-relaxed max-w-xl">
              اقرأ واستمع لكتاب الله بأصوات نديّة، وتذكّر ربك في كل وقت — كل ما
              تحتاجه ليومك الإيماني في مكان واحد.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => playSurah(1)} className="btn btn-primary text-base">
                <Play size={19} />
                استمع إلى القرآن
              </button>
              <Link href="/quran" className="btn btn-ghost text-base">
                <BookOpen size={19} />
                اقرأ القرآن
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="anim-float">
              <Logo size={170} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== الصلاة القادمة + محتوى اليوم ===== */}
      <section className="grid gap-4 md:grid-cols-3 anim-rise" style={{ animationDelay: "0.08s" }}>
        <NextPrayerCard />
        {/* حديث اليوم */}
        {dailyHadith && (
          <Link href="/hadith" className="md:col-span-2 block">
            <Card hover className="p-6 h-full">
              <div className="flex items-center gap-2 text-[var(--gold)] text-sm font-bold mb-3">
                <ScrollText size={16} />
                حديث اليوم
              </div>
              <p className="text-lg leading-loose font-semibold" style={{ fontFamily: "var(--font-quran)" }}>
                «{dailyHadith.text}»
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {dailyHadith.narrator} — {dailyHadith.reference}
              </p>
            </Card>
          </Link>
        )}
      </section>

      {/* ===== ذِكر الوقت ===== */}
      <Link href={mounted ? (isMorning ? "/adhkar?cat=morning" : "/adhkar?cat=evening") : "/adhkar"} className="block anim-rise" style={{ animationDelay: "0.12s" }}>
        <Card hover className="p-6 flex items-center gap-5">
          <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white shrink-0">
            {mounted && !isMorning ? <Sunset size={26} /> : <Sunrise size={26} />}
          </span>
          <div className="flex-1">
            <p className="text-xl font-black">
              {mounted ? (isMorning ? "أذكار الصباح" : "أذكار المساء") : "أذكار الصباح والمساء"}
            </p>
            <p className="text-[var(--muted)]">
              {mounted
                ? isMorning
                  ? "ابدأ يومك بحصنٍ من الأذكار المأثورة"
                  : "اختم يومك بذكرٍ يطمئن به قلبك"
                : "حصّن يومك كله بالأذكار المأثورة"}
            </p>
          </div>
          <ChevronLeft className="text-[var(--muted)]" size={22} />
        </Card>
      </Link>

      {/* ===== واصل رحلتك ===== */}
      <ContinueJourney />

      {/* ===== الوصول السريع ===== */}
      <section>
        <SectionTitle title="الوصول السريع" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {QUICK.map((q) => (
            <Link key={q.href} href={q.href}>
              <Card hover className="p-5 h-full group">
                <span className="grid place-items-center w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--emerald)_14%,transparent)] text-[var(--gold)] border border-[var(--line)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <q.icon size={22} />
                </span>
                <p className="mt-4 font-black text-lg">{q.label}</p>
                <p className="text-sm text-[var(--muted)] mt-1">{q.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <OrnamentLite />
    </div>
  );
}
