import { describe, it, expect } from "vitest";
import { SURAHS, TOTAL_AYAHS } from "@/lib/data/surahs";
import { HADITHS, validateHadiths, HADITH_TOPICS } from "@/lib/data/hadiths";
import { ADHKAR } from "@/lib/data/adhkar";
import { RECITERS, RADIO_STATIONS } from "@/lib/data/audio";

describe("بيانات القرآن الكريم", () => {
  it("تحتوي على ١١٤ سورة بالضبط", () => {
    expect(SURAHS).toHaveLength(114);
  });
  it("الترقيم متسلسل من ١ إلى ١١٤", () => {
    SURAHS.forEach((s, i) => expect(s.n).toBe(i + 1));
  });
  it("مجموع الآيات ٦٢٣٦ (عدّ حفص القياسي)", () => {
    expect(TOTAL_AYAHS).toBe(6236);
  });
  it("لكل سورة اسم وعدد آيات صحيح ونوع", () => {
    for (const s of SURAHS) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.ayahs).toBeGreaterThan(0);
      expect(["مكية", "مدنية"]).toContain(s.type);
    }
  });
});

describe("مكتبة الأحاديث", () => {
  it("تحتوي على ١٠٠ حديث موثق", () => {
    expect(HADITHS.length).toBe(100);
  });
  it("لا توجد أخطاء في سلامة البيانات", () => {
    expect(validateHadiths()).toEqual([]);
  });
  it("كل حديث له مصدر ومرجع ودرجة معروفة", () => {
    for (const h of HADITHS) {
      expect(h.collection.length).toBeGreaterThan(2);
      expect(h.reference).toMatch(/صحيح|سنن|جامع|الأربعون/);
      expect(["صحيح", "حسن", "حسن صحيح", "حسن لغيره"]).toContain(h.grade);
      for (const t of h.topics) {
        expect(HADITH_TOPICS).toContain(t);
      }
    }
  });
});

describe("مكتبة الأذكار", () => {
  it("تغطي الأقسام الثمانية المطلوبة", () => {
    const ids = ADHKAR.map((c) => c.id);
    for (const req of [
      "morning", "evening", "after-prayer", "sleep", "waking",
      "general", "quran-duas", "prophet-duas",
    ]) {
      expect(ids).toContain(req);
    }
  });
  it("كل ذكر له نص ومصدر وعدد تكرار صحيح", () => {
    const ids = new Set<string>();
    for (const c of ADHKAR) {
      expect(c.title.length).toBeGreaterThan(0);
      for (const d of c.items) {
        expect(ids.has(d.id)).toBe(false);
        ids.add(d.id);
        expect(d.text.trim().length).toBeGreaterThan(5);
        expect(d.source.trim().length).toBeGreaterThan(2);
        expect(d.count).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("مصادر الصوت", () => {
  it("كل قارئ يولّد روابط HTTPS سليمة لكل السور", () => {
    for (const r of RECITERS) {
      for (const n of [1, 36, 114]) {
        expect(r.primary(n)).toMatch(/^https:\/\//);
        if (r.fallback) expect(r.fallback(n)).toMatch(/^https:\/\//);
      }
    }
  });
  it("محطات الإذاعة كلها عبر HTTPS مع أسماء", () => {
    expect(RADIO_STATIONS.length).toBeGreaterThanOrEqual(5);
    for (const s of RADIO_STATIONS) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });
});
