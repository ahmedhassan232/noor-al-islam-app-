// ===== مواقيت الصلاة — حساب محلي موثوق عبر مكتبة adhan =====
import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
} from "adhan";

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export const CITIES: City[] = [
  { id: "makkah", name: "مكة المكرمة", country: "السعودية", lat: 21.4225, lng: 39.8262 },
  { id: "madinah", name: "المدينة المنورة", country: "السعودية", lat: 24.4672, lng: 39.6111 },
  { id: "riyadh", name: "الرياض", country: "السعودية", lat: 24.7136, lng: 46.6753 },
  { id: "jeddah", name: "جدة", country: "السعودية", lat: 21.4858, lng: 39.1925 },
  { id: "cairo", name: "القاهرة", country: "مصر", lat: 30.0444, lng: 31.2357 },
  { id: "alexandria", name: "الإسكندرية", country: "مصر", lat: 31.2001, lng: 29.9187 },
  { id: "amman", name: "عمّان", country: "الأردن", lat: 31.9454, lng: 35.9284 },
  { id: "jerusalem", name: "القدس", country: "فلسطين", lat: 31.7683, lng: 35.2137 },
  { id: "damascus", name: "دمشق", country: "سوريا", lat: 33.5138, lng: 36.2765 },
  { id: "beirut", name: "بيروت", country: "لبنان", lat: 33.8938, lng: 35.5018 },
  { id: "baghdad", name: "بغداد", country: "العراق", lat: 33.3152, lng: 44.3661 },
  { id: "kuwait", name: "مدينة الكويت", country: "الكويت", lat: 29.3759, lng: 47.9774 },
  { id: "doha", name: "الدوحة", country: "قطر", lat: 25.2854, lng: 51.531 },
  { id: "dubai", name: "دبي", country: "الإمارات", lat: 25.2048, lng: 55.2708 },
  { id: "manama", name: "المنامة", country: "البحرين", lat: 26.2285, lng: 50.586 },
  { id: "muscat", name: "مسقط", country: "عُمان", lat: 23.588, lng: 58.3829 },
  { id: "sanaa", name: "صنعاء", country: "اليمن", lat: 15.3694, lng: 44.191 },
  { id: "khartoum", name: "الخرطوم", country: "السودان", lat: 15.5007, lng: 32.5599 },
  { id: "tripoli", name: "طرابلس", country: "ليبيا", lat: 32.8872, lng: 13.1913 },
  { id: "tunis", name: "تونس", country: "تونس", lat: 36.8065, lng: 10.1815 },
  { id: "algiers", name: "الجزائر", country: "الجزائر", lat: 36.7538, lng: 3.0588 },
  { id: "rabat", name: "الرباط", country: "المغرب", lat: 34.0209, lng: -6.8416 },
  { id: "casablanca", name: "الدار البيضاء", country: "المغرب", lat: 33.5731, lng: -7.5898 },
  { id: "nouakchott", name: "نواكشوط", country: "موريتانيا", lat: 18.0735, lng: -15.9582 },
  { id: "istanbul", name: "إسطنبول", country: "تركيا", lat: 41.0082, lng: 28.9784 },
  { id: "ankara", name: "أنقرة", country: "تركيا", lat: 39.9334, lng: 32.8597 },
  { id: "karachi", name: "كراتشي", country: "باكستان", lat: 24.8607, lng: 67.0011 },
  { id: "jakarta", name: "جاكرتا", country: "إندونيسيا", lat: -6.2088, lng: 106.8456 },
  { id: "kualalumpur", name: "كوالالمبور", country: "ماليزيا", lat: 3.139, lng: 101.6869 },
  { id: "london", name: "لندن", country: "بريطانيا", lat: 51.5074, lng: -0.1278 },
  { id: "paris", name: "باريس", country: "فرنسا", lat: 48.8566, lng: 2.3522 },
  { id: "newyork", name: "نيويورك", country: "أمريكا", lat: 40.7128, lng: -74.006 },
];

export const CALC_METHODS = [
  { id: "Egyptian", name: "الهيئة المصرية العامة للمساحة" },
  { id: "UmmAlQura", name: "أم القرى (السعودية)" },
  { id: "MuslimWorldLeague", name: "رابطة العالم الإسلامي" },
  { id: "Karachi", name: "جامعة كراتشي" },
  { id: "NorthAmerica", name: "أمريكا الشمالية (ISNA)" },
  { id: "Kuwait", name: "الكويت" },
  { id: "Qatar", name: "قطر" },
  { id: "Dubai", name: "الإمارات" },
] as const;

export const PRAYER_NAMES: { id: string; name: string; icon: string }[] = [
  { id: "fajr", name: "الفجر", icon: "" },
  { id: "sunrise", name: "الشروق", icon: "" },
  { id: "dhuhr", name: "الظهر", icon: "" },
  { id: "asr", name: "العصر", icon: "" },
  { id: "maghrib", name: "المغرب", icon: "" },
  { id: "isha", name: "العشاء", icon: "" },
];

export interface DayPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

function methodParams(id: string) {
  const fns = CalculationMethod as unknown as Record<
    string,
    () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>
  >;
  const fn = fns[id];
  const params = fn ? fn() : CalculationMethod.Egyptian();
  params.madhab = Madhab.Shafi;
  return params;
}

/** حساب مواقيت يوم كامل لمدينة معروفة الإحداثيات */
export function computeTimes(
  lat: number,
  lng: number,
  date = new Date(),
  methodId = "Egyptian"
): DayPrayerTimes {
  const coords = new Coordinates(lat, lng);
  const pt = new PrayerTimes(coords, date, methodParams(methodId));
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

export interface NextPrayerInfo {
  id: string;
  name: string;
  at: Date;
  currentId: string | null;
}

const PRAYER_ORDER: { id: keyof DayPrayerTimes }[] = [
  { id: "fajr" },
  { id: "sunrise" },
  { id: "dhuhr" },
  { id: "asr" },
  { id: "maghrib" },
  { id: "isha" },
];

/** الصلاة القادمة (مع الانتقال لفجر الغد عند تجاوز العشاء) */
export function getNextPrayer(
  lat: number,
  lng: number,
  methodId = "Egyptian",
  now = new Date()
): NextPrayerInfo {
  const today = computeTimes(lat, lng, now, methodId);
  const nameOf = (id: string) =>
    PRAYER_NAMES.find((p) => p.id === id)?.name ?? id;
  let currentId: string | null = null;
  for (const step of PRAYER_ORDER) {
    const at = today[step.id];
    if (at.getTime() > now.getTime()) {
      return { id: step.id, name: nameOf(step.id), at, currentId };
    }
    currentId = step.id;
  }
  // بعد العشاء: فجر الغد
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const t = computeTimes(lat, lng, tomorrow, methodId);
  return { id: "fajr", name: nameOf("fajr"), at: t.fajr, currentId: "isha" };
}
