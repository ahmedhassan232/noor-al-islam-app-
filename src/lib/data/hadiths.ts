// ===== مكتبة الأحاديث — الفهرس والأنماط والتحقق =====
import { arabicIncludes } from "../utils";
import { HADITHS_1 } from "./hadiths-1";
import { HADITHS_2 } from "./hadiths-2";

export interface Hadith {
  id: string;
  text: string;
  narrator: string;
  collection: string;
  reference: string;
  grade: "صحيح" | "حسن" | "حسن صحيح" | "حسن لغيره";
  topics: string[];
}

export const HADITHS: Hadith[] = [...HADITHS_1, ...HADITHS_2];

export const HADITH_TOPICS = [
  "الإيمان والإخلاص",
  "الصلاة",
  "الأخلاق",
  "الرحمة",
  "الصبر",
  "الشكر",
  "العلم",
  "الأسرة",
  "الصدقة",
  "الدعاء",
  "الصيام",
  "الذكر",
] as const;

export const HADITH_COLLECTIONS = [
  "متفق عليه",
  "صحيح البخاري",
  "صحيح مسلم",
  "جامع الترمذي",
  "سنن أبي داود",
  "سنن ابن ماجه",
] as const;

export function searchHadiths(
  list: Hadith[],
  query: string,
  topic = "",
  collection = ""
): Hadith[] {
  return list.filter((h) => {
    if (topic && !h.topics.includes(topic)) return false;
    if (collection && h.collection !== collection) return false;
    if (!query.trim()) return true;
    return (
      arabicIncludes(h.text, query) ||
      arabicIncludes(h.narrator, query) ||
      h.topics.some((t) => arabicIncludes(t, query))
    );
  });
}

/** التحقق من سلامة البيانات — يُستخدم في الاختبارات ووقت التشغيل */
export function validateHadiths(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const h of HADITHS) {
    if (ids.has(h.id)) errors.push(`معرّف مكرر: ${h.id}`);
    ids.add(h.id);
    if (!h.text || h.text.trim().length < 10)
      errors.push(`نص ناقص أو قصير: ${h.id}`);
    if (!h.narrator?.trim()) errors.push(`راوٍ مفقود: ${h.id}`);
    if (!h.collection?.trim()) errors.push(`مصدر مفقود: ${h.id}`);
    if (!h.reference?.trim()) errors.push(`مرجع مفقود: ${h.id}`);
    if (!h.topics?.length) errors.push(`تصنيف مفقود: ${h.id}`);
    for (const t of h.topics) {
      if (!(HADITH_TOPICS as readonly string[]).includes(t))
        errors.push(`تصنيف غير معروف "${t}" في ${h.id}`);
    }
  }
  return errors;
}
