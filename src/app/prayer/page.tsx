"use client";
// ===== مواقيت الصلاة =====
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MoonStar,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  MapPin,
  Compass as CompassIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { Card } from "@/components/homebits";
import {
  CITIES,
  CALC_METHODS,
  computeTimes,
  getNextPrayer,
  PRAYER_NAMES,
  type DayPrayerTimes,
} from "@/lib/services/prayer";
import { usePrefs } from "@/lib/services/prefsStore";
import { arDigits, formatClock, formatCountdown, gregorianDate, hijriDate, cn } from "@/lib/utils";

const ICONS: Record<string, typeof Sun> = {
  fajr: MoonStar,
  sunrise: Sunrise,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
};

export default function PrayerPage() {
  const cityId = usePrefs((s) => s.cityId);
  const setCity = usePrefs((s) => s.setCity);
  const method = usePrefs((s) => s.calcMethod);
  const setCalcMethod = usePrefs((s) => s.setCalcMethod);
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];

  // null = لم يُركَّب بعد: مخرجات متطابقة على الخادم والعميل
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const times: DayPrayerTimes | null = useMemo(
    () => (now ? computeTimes(city.lat, city.lng, now, method) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city.lat, city.lng, method, now ? localDateStr(now) : ""]
  );
  const next = useMemo(
    () => (now ? getNextPrayer(city.lat, city.lng, method, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city.lat, city.lng, method, now ? Math.floor(now.getTime() / 15000) : 0]
  );

  return (
    <div>
      <PageHeader
        title="مواقيت الصلاة"
        subtitle="حساب فلكي محلي دقيق — لا بيانات زائفة"
        icon={<MoonStar size={26} />}
      />

      {/* بطاقة العد التنازلي */}
      <Card className="p-7 md:p-9 relative overflow-hidden anim-rise mb-8">
        <div className="absolute inset-0 geo-pattern opacity-40" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="text-[var(--muted)] font-bold min-h-6">
              {now ? (
                <p>
                  {gregorianDate(now)} — <span className="text-[var(--gold)]">{hijriDate(now)}</span>
                </p>
              ) : (
                <span className="skeleton inline-block h-4 w-72" aria-hidden="true" />
              )}
            </div>
            <h2 className="mt-2 text-4xl md:text-5xl font-black">
              {next ? `متبقٍ على ${next.name}` : "متبقٍ على الصلاة التالية"}
            </h2>
            {next && now ? (
              <p className="mt-3 text-5xl md:text-6xl font-black text-[var(--gold)] tabular-nums" dir="ltr">
                {formatCountdown(Math.max(0, next.at.getTime() - now.getTime()))}
              </p>
            ) : (
              <div className="skeleton h-14 w-56 mt-3" aria-hidden="true" />
            )}
            <div className="mt-2 text-[var(--muted)] min-h-6">
              {next ? (
                <p>يحين في {formatClock(next.at)} — {city.name}</p>
              ) : (
                <span className="skeleton inline-block h-4 w-44" aria-hidden="true" />
              )}
            </div>
          </div>
          <div className="grid place-items-center">
            <span className="grid place-items-center w-28 h-28 rounded-full bg-[color-mix(in_srgb,var(--emerald)_15%,transparent)] border border-[var(--line-strong)] anim-float">
              {(() => {
                const Icon = (next ? ICONS[next.id] : undefined) ?? MoonStar;
                return <Icon size={48} className="text-[var(--gold)]" />;
              })()}
            </span>
          </div>
        </div>
      </Card>

      {/* اختيار المدينة والمذهب */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] mb-2">
            <MapPin size={15} /> المدينة
          </label>
          <select
            value={cityId}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3 font-bold outline-none focus:border-[var(--ring)]"
            aria-label="اختيار المدينة"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.country}
              </option>
            ))}
          </select>
        </div>
        <div className="card p-4">
          <label className="text-sm font-bold text-[var(--muted)] mb-2 block">
            جهة الحساب
          </label>
          <select
            value={method}
            onChange={(e) => setCalcMethod(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3 font-bold outline-none focus:border-[var(--ring)]"
            aria-label="طريقة الحساب"
          >
            {CALC_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول اليوم */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        {PRAYER_NAMES.map((p) => {
          const Icon = ICONS[p.id] ?? Sun;
          const at = times ? times[p.id as keyof DayPrayerTimes] : null;
          const isNext = next ? next.id === p.id : false;
          return (
            <Card
              key={p.id}
              hover
              className={cn(
                "p-5 text-center",
                isNext && "border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--emerald)_10%,var(--surface))]"
              )}
            >
              <span
                className={cn(
                  "mx-auto grid place-items-center w-12 h-12 rounded-2xl border",
                  isNext
                    ? "bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white border-transparent"
                    : "text-[var(--gold)] border-[var(--line)] bg-[var(--surface-2)]"
                )}
              >
                <Icon size={22} />
              </span>
              <p className="mt-3 font-black">{p.name}</p>
              <p className={cn("text-lg font-black tabular-nums", isNext ? "text-[var(--gold)]" : "text-[var(--muted)]")}>
                {at ? formatClock(at) : "—:—"}
              </p>
              {isNext && (
                <p className="text-[10px] font-bold text-[var(--gold)] mt-1">التالية</p>
              )}
            </Card>
          );
        })}
      </div>

      <Link href="/qibla" className="btn btn-ghost mt-8">
        <CompassIcon size={18} />
        تحديد اتجاه القبلة
      </Link>
    </div>
  );
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
