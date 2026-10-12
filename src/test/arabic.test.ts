import { describe, it, expect } from "vitest";
import {
  normalizeArabic,
  arabicIncludes,
  arDigits,
  formatDuration,
} from "@/lib/utils";

describe("تطبيع النص العربي للبحث", () => {
  it("يزيل التشكيل", () => {
    expect(normalizeArabic("بِسْمِ اللَّهِ")).toBe("بسم الله");
  });
  it("يوحّد أشكال الألف", () => {
    expect(normalizeArabic("أإآٱ")).toBe("اااا");
    expect(arabicIncludes("الإسراء", "الاسراء")).toBe(true);
  });
  it("يوحّد التاء المربوطة والهاء", () => {
    expect(arabicIncludes("الفاتحة", "الفاتحه")).toBe(true);
  });
  it("يوحّد الألف المقصورة والياء", () => {
    expect(arabicIncludes("هدى", "هدي")).toBe(true);
  });
  it("يزيل التطويل والمسافات الزائدة", () => {
    expect(normalizeArabic("  ســورة   يس  ")).toBe("سوره يس");
  });
  it("يتعامل مع الهمزات على الواو والياء", () => {
    expect(arabicIncludes("مؤمن", "مومن")).toBe(true);
    expect(arabicIncludes("سئل", "سيل")).toBe(true);
  });
  it("لا يغيّر النص الأصلي المعروض", () => {
    const original = "بِسْمِ اللَّهِ الرَّحْمَٰنِ";
    normalizeArabic(original);
    expect(original).toBe("بِسْمِ اللَّهِ الرَّحْمَٰنِ");
  });
});

describe("أدوات التنسيق", () => {
  it("يحوّل الأرقام إلى عربية", () => {
    expect(arDigits(114)).toBe("١١٤");
    expect(arDigits("03:25")).toBe("٠٣:٢٥");
  });
  it("ينسّق المدد بدقة", () => {
    expect(formatDuration(65)).toBe("١:٠٥");
    expect(formatDuration(3661)).toBe("١:٠١:٠١");
    expect(formatDuration(NaN)).toBe("٠:٠٠");
    expect(formatDuration(-5)).toBe("٠:٠٠");
    expect(formatDuration(65, false)).toBe("1:05");
  });
});
