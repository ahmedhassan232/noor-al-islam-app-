// ===== بيانات القرّاء ومحطات الإذاعة الموثقة =====
// كل الروابط أدناه تم التحقق من استجابتها فعلياً (HTTP 200/206 audio/mpeg).

export interface Reciter {
  id: string;
  name: string;
  style: string;
  /** مُنشئ رابط السورة الأساسي */
  primary: (surah: number) => string;
  /** مصدر احتياطي موثق لنفس القارئ (إن وُجد) */
  fallback?: (surah: number) => string;
}

const pad3 = (n: number) => String(n).padStart(3, "0");
const islamicCdn = (edition: string) => (n: number) =>
  `https://cdn.islamic.network/quran/audio/128/${edition}/${n}.mp3`;
const mp3quran = (server: string, key: string) => (n: number) =>
  `https://${server}.mp3quran.net/${key}/${pad3(n)}.mp3`;

export const RECITERS: Reciter[] = [
  {
    id: "ar.alafasy",
    name: "مشاري بن راشد العفاسي",
    style: "مرتّل",
    primary: islamicCdn("ar.alafasy"),
    fallback: mp3quran("server8", "afs"),
  },
  {
    id: "ar.husary",
    name: "محمود خليل الحصري",
    style: "مرتّل",
    primary: islamicCdn("ar.husary"),
    fallback: mp3quran("server13", "husr"),
  },
  {
    id: "ar.mahermuaiqly",
    name: "ماهر المعيقلي",
    style: "مرتّل",
    primary: islamicCdn("ar.mahermuaiqly"),
    fallback: mp3quran("server12", "maher"),
  },
  {
    id: "ar.minshawi",
    name: "محمد صديق المنشاوي",
    style: "مرتّل",
    primary: islamicCdn("ar.minshawi"),
    fallback: mp3quran("server10", "minsh"),
  },
  {
    id: "ar.hudhaify",
    name: "علي بن عبدالرحمن الحذيفي",
    style: "مرتّل",
    primary: islamicCdn("ar.hudhaify"),
    fallback: mp3quran("server11", "hthfi"),
  },
  {
    id: "ar.shaatree",
    name: "أبو بكر الشاطري",
    style: "مرتّل",
    primary: islamicCdn("ar.shaatree"),
  },
];

export const DEFAULT_RECITER = "ar.alafasy";

export function getReciter(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

// ===== محطات الإذاعة — تحقق فعلي من البث المباشر عبر HTTPS =====
export interface RadioStation {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: "tarateel",
    name: "إذاعة التراتيل",
    description: "تراتيل قصار السور بأصوات متعددة",
    url: "https://backup.qurango.net/radio/tarateel",
  },
  {
    id: "salma",
    name: "إذاعة سلمى",
    description: "تلاوات متنوعة على مدار الساعة",
    url: "https://backup.qurango.net/radio/salma",
  },
  {
    id: "albaqarah",
    name: "إذاعة سورة البقرة",
    description: "سورة البقرة بتلاوات متتابعة",
    url: "https://backup.qurango.net/radio/albaqarah",
  },
  {
    id: "ibrahim_alakdar",
    name: "إذاعة إبراهيم الأخضر",
    description: "تسجيلات الشيخ إبراهيم الأخضر",
    url: "https://backup.qurango.net/radio/ibrahim_alakdar",
  },
  {
    id: "ahmad_alajmy",
    name: "إذاعة أحمد العجمي",
    description: "تسجيلات الشيخ أحمد العجمي",
    url: "https://backup.qurango.net/radio/ahmad_alajmy",
  },
  {
    id: "idrees_abkr",
    name: "إذاعة إدريس أبكر",
    description: "تسجيلات الشيخ إدريس أبكر",
    url: "https://backup.qurango.net/radio/idrees_abkr",
  },
];
