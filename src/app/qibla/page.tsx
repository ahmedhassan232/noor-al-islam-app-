"use client";
// ===== اتجاه القبلة — حساب دقيق + بوصلة تفاعلية =====
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Compass as CompassIcon,
  MapPin,
  LocateFixed,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { Card } from "@/components/homebits";
import { qiblaBearing, distanceToKaaba, compassPoint, KAABA } from "@/lib/services/qibla";
import { CITIES } from "@/lib/services/prayer";
import { usePrefs } from "@/lib/services/prefsStore";
import { arDigits, cn } from "@/lib/utils";

type OrientState =
  | { mode: "unsupported" }
  | { mode: "idle" }
  | { mode: "live"; heading: number | null };

interface DeviceOrientationWithPermission extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}
interface DeviceOrientationStatic extends EventTarget {
  requestPermission?: () => Promise<string>;
}

export default function QiblaPage() {
  const cityId = usePrefs((s) => s.cityId);
  const setCity = usePrefs((s) => s.setCity);
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "denied">("idle");
  const [orient, setOrient] = useState<OrientState>({ mode: "idle" });
  const [manualOffset, setManualOffset] = useState(0);

  const lat = coords?.lat ?? city.lat;
  const lng = coords?.lng ?? city.lng;
  const bearing = useMemo(() => qiblaBearing(lat, lng), [lat, lng]);
  const distance = useMemo(() => distanceToKaaba(lat, lng), [lat, lng]);

  // تمييز دعم حساس الاتجاه مرة واحدة
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSensors = "DeviceOrientationEvent" in window;
    if (!hasSensors) setOrient({ mode: "unsupported" });
  }, []);

  const attach = useCallback(() => {
    const handler = (e: DeviceOrientationWithPermission) => {
      let heading: number | null = null;
      if (typeof e.webkitCompassHeading === "number") {
        heading = e.webkitCompassHeading; // iOS: اتجاه البوصلة الحقيقي
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360; // تقريب للأجهزة الأخرى
      }
      setOrient({ mode: "live", heading });
    };
    window.addEventListener("deviceorientation", handler as EventListener);
    return () =>
      window.removeEventListener("deviceorientation", handler as EventListener);
  }, []);

  const enableCompass = async () => {
    try {
      const ctor = (window as unknown as { DeviceOrientationEvent?: DeviceOrientationStatic })
        .DeviceOrientationEvent;
      if (ctor?.requestPermission) {
        const res = await ctor.requestPermission();
        if (res !== "granted") {
          setOrient({ mode: "unsupported" });
          return;
        }
      }
    } catch {
      setOrient({ mode: "unsupported" });
      return;
    }
    const detach = attach();
    setOrient({ mode: "live", heading: null });
    setTimeout(() => {}, 0);
    return detach;
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoState("denied");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("idle");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const liveHeading = orient.mode === "live" ? orient.heading : null;
  // زاوية إبرة القبلة على الشاشة: اتجاه القبلة نسبة لاتجاه الجهاز
  const needleDeg =
    liveHeading !== null ? bearing - liveHeading : bearing - manualOffset;

  return (
    <div>
      <PageHeader
        title="اتجاه القبلة"
        subtitle={`نحو الكعبة المشرفة (${arDigits(KAABA.lat)}°، ${arDigits(KAABA.lng)}°)`}
        icon={<CompassIcon size={26} />}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* البوصلة */}
        <Card className="p-8 flex flex-col items-center anim-rise">
          <div className="relative w-64 h-64 md:w-72 md:h-72">
            {/* قرص البوصلة */}
            <div
              className="absolute inset-0 rounded-full border-2 border-[var(--line-strong)] bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--emerald)_12%,transparent),transparent_70%)] transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${liveHeading !== null ? -liveHeading : -manualOffset}deg)` }}
            >
              {Array.from({ length: 72 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "absolute left-1/2 top-0 h-3 w-px origin-[50%_128px] md:origin-[50%_144px] bg-[var(--muted)]",
                    i % 18 === 0 && "h-5 w-0.5 bg-[var(--gold)]"
                  )}
                  style={{ transform: `translateX(-50%) rotate(${i * 5}deg)` }}
                />
              ))}
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-black text-[var(--danger)]">ش</span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-black text-[var(--muted)]">ج</span>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[var(--muted)]">غ</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[var(--muted)]">ق</span>
            </div>

            {/* إبرة القبلة */}
            <div
              className="absolute inset-0 grid place-items-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${needleDeg}deg)` }}
            >
              <svg width="46" height="180" viewBox="0 0 46 180" className="drop-shadow-lg">
                <path d="M23 4 L34 96 L23 88 L12 96 Z" fill="url(#qibla-g)" />
                <path d="M23 176 L34 96 L23 104 L12 96 Z" fill="#3a4a42" />
                <defs>
                  <linearGradient id="qibla-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8D5A8" />
                    <stop offset="100%" stopColor="#D6B46A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* مركز */}
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <span className="w-14 h-14 rounded-full bg-[var(--surface)] border border-[var(--line-strong)] grid place-items-center shadow-lg">
                <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.5" y="7" width="17" height="13" rx="1.2" fill="#1c2420" stroke="var(--gold)" strokeWidth="0.8" />
                  <rect x="3.5" y="9.2" width="17" height="1.6" fill="var(--gold)" />
                  <rect x="3.5" y="4.6" width="17" height="2.4" rx="1" fill="#141b18" stroke="var(--gold)" strokeWidth="0.6" />
                </svg>
              </span>
            </div>
          </div>

          <p className="mt-6 text-3xl font-black text-[var(--gold)] tabular-nums">
            {arDigits(bearing)}°
          </p>
          <p className="text-[var(--muted)] font-bold">
            {compassPoint(bearing)} — على بُعد {arDigits(distance)} كم من الكعبة
          </p>

          {/* التحكم اليدوي عند غياب الحساس */}
          {liveHeading === null && (
            <div className="w-full mt-6">
              <p className="text-xs text-[var(--muted)] mb-2 text-center">
                {orient.mode === "unsupported"
                  ? "الجهاز لا يوفّر حساس اتجاه — أدر القرص يدوياً حتى يوافق «ش» الشمال الحقيقي"
                  : "فعّل البوصلة الحية، أو أدر القرص يدوياً ليطابق الشمال"}
              </p>
              <input
                type="range"
                min={-180}
                max={180}
                value={manualOffset}
                onChange={(e) => setManualOffset(Number(e.target.value))}
                className="w-full"
                aria-label="تدوير يدوي للبوصلة"
              />
            </div>
          )}

          {orient.mode === "idle" && (
            <button onClick={() => void enableCompass()} className="btn btn-ghost mt-5">
              <CompassIcon size={17} />
              تفعيل البوصلة الحية
            </button>
          )}
          {orient.mode === "live" && liveHeading === null && (
            <p className="mt-5 flex items-center gap-2 text-[var(--gold)] text-sm font-bold">
              <Loader2 size={16} className="animate-spin" />
              في انتظار حساس الاتجاه… حرّك جهازك على شكل ٨ للمعايرة
            </p>
          )}
        </Card>

        {/* الموقع */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-[var(--gold)]" />
              موقعك
            </h3>
            <select
              value={cityId}
              onChange={(e) => {
                setCoords(null);
                setCity(e.target.value);
              }}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3 font-bold outline-none focus:border-[var(--ring)]"
              aria-label="اختيار المدينة"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.country}
                </option>
              ))}
            </select>
            <button
              onClick={locate}
              disabled={geoState === "loading"}
              className="btn btn-primary w-full mt-4"
            >
              {geoState === "loading" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LocateFixed size={18} />
              )}
              تحديد موقعي بدقة (GPS)
            </button>
            {coords && (
              <p className="mt-3 text-xs text-[var(--muted)] text-center tabular-nums" dir="ltr">
                {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
              </p>
            )}
            {geoState === "denied" && (
              <p className="mt-3 flex items-center gap-2 text-sm text-[var(--danger)]">
                <AlertTriangle size={15} />
                تعذّر الوصول للموقع — تأكد من منح الإذن، أو اختر مدينتك يدوياً.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-black text-lg mb-3">كيف تستخدم البوصلة؟</h3>
            <ul className="space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
              <li>• الإبرة الذهبية تشير دائماً نحو الكعبة المشرفة.</li>
              <li>• عند تفعيل البوصلة الحية يدور القرص تلقائياً مع جهازك.</li>
              <li>• إن لم يدعم جهازك حساس الاتجاه: أدر المؤشر يدوياً حتى يوافق حرف «ش» اتجاه الشمال الجغرافي.</li>
              <li>• ابتعد عن المعادن والمغناطيس لمعايرة أدق (حرّك الجهاز على شكل ٨).</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
