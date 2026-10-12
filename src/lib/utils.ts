// ===== أدوات مساعدة عامة — Noor Al-Islam =====

/** دمج أسماء الأصناف */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** تحويل الأرقام اللاتينية إلى أرقام عربية مشرقية */
export function arDigits(input: string | number): string {
  const map: Record<string, string> = {
    "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
    "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩",
  };
  return String(input).replace(/[0-9]/g, (d) => map[d] ?? d);
}

/**
 * تطبيع النص العربي للبحث فقط — لا يُعدِّل النص المعروض أبداً.
 * يزيل التشكيل والتطويل، ويوحّد الألف والهمزات والتاء المربوطة والألف المقصورة.
 */
export function normalizeArabic(text: string): string {
  return String(text)
    .replace(/[ً-ٟۖ-ۭ]/g, "") // التشكيل وعلامات الوقف
    .replace(/ـ/g, "") // التطويل
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** مطابقة بحث عربي متساهلة */
export function arabicIncludes(haystack: string, needle: string): boolean {
  const n = normalizeArabic(needle);
  if (!n) return true;
  return normalizeArabic(haystack).includes(n);
}

/** تنسيق مدة زمنية ثوانٍ → "د:ث" أو "س:د:ث" */
export function formatDuration(seconds: number, arabic = true): string {
  if (!Number.isFinite(seconds) || seconds < 0) return arabic ? "٠:٠٠" : "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  const out = h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  return arabic ? arDigits(out) : out;
}

/** تنسيق مدة متبقية بصيغة عربية مطوّلة */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return arDigits("00:00:00");
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return arDigits(
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  );
}

/** تنسيق ساعة من كائن Date بصيغة ١٢ ساعة عربية */
export function formatClock(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? "م" : "ص";
  h = h % 12;
  if (h === 0) h = 12;
  return `${arDigits(h)}:${arDigits(String(m).padStart(2, "0"))} ${suffix}`;
}

/** التاريخ الهجري عبر تقويم أم القرى المدمج في المتصفح */
export function hijriDate(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/** التاريخ الميلادي بالعربية */
export function gregorianDate(date = new Date()): string {
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** رقم اليوم في السنة — لاختيار "محتوى اليوم" بثبات */
export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

/** مفتاح تاريخ محلي YYYY-MM-DD */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** اختيار عنصر مستقر بناءً على بذرة (اليوم) */
export function pickDaily<T>(items: T[], seed = dayOfYear()): T | undefined {
  if (items.length === 0) return undefined;
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return items[h % items.length];
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** جلب مع مهلة زمنية وقابلية للإلغاء */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const outer = options.signal;
  const onAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
    if (outer) outer.removeEventListener("abort", onAbort);
  }
}
