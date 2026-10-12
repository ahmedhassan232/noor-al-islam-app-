import { describe, it, expect } from "vitest";
import { qiblaBearing, distanceToKaaba, compassPoint } from "@/lib/services/qibla";
import { computeTimes, getNextPrayer, CITIES } from "@/lib/services/prayer";

describe("حساب القبلة", () => {
  it("القاهرة ≈ ١٣٦ درجة", () => {
    const b = qiblaBearing(30.0444, 31.2357);
    expect(b).toBeGreaterThan(130);
    expect(b).toBeLessThan(142);
  });
  it("جاكرتا ≈ ٢٩٥ درجة", () => {
    const b = qiblaBearing(-6.2088, 106.8456);
    expect(b).toBeGreaterThan(288);
    expect(b).toBeLessThan(302);
  });
  it("لندن ≈ ١١٩ درجة", () => {
    const b = qiblaBearing(51.5074, -0.1278);
    expect(b).toBeGreaterThan(113);
    expect(b).toBeLessThan(126);
  });
  it("نيويورك ≈ ٥٨ درجة", () => {
    const b = qiblaBearing(40.7128, -74.006);
    expect(b).toBeGreaterThan(53);
    expect(b).toBeLessThan(64);
  });
  it("الزاوية دائماً بين ٠ و٣٦٠", () => {
    for (const c of CITIES) {
      const b = qiblaBearing(c.lat, c.lng);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });
  it("المسافة إلى الكعبة من مكة صغيرة", () => {
    expect(distanceToKaaba(21.4225, 39.8262)).toBeLessThan(2);
  });
  it("المسافة من القاهرة منطقية", () => {
    const d = distanceToKaaba(30.0444, 31.2357);
    expect(d).toBeGreaterThan(1200);
    expect(d).toBeLessThan(1400);
  });
  it("الاتجاه البوصلي النصي", () => {
    expect(compassPoint(0)).toBe("شمال");
    expect(compassPoint(90)).toBe("شرق");
    expect(compassPoint(136)).toBe("جنوب شرق");
    expect(compassPoint(359)).toBe("شمال");
  });
});

describe("حساب مواقيت الصلاة", () => {
  const now = new Date("2025-03-10T12:00:00");
  it("ترتيب صحيح: فجر < شروق < ظهر < عصر < مغرب < عشاء", () => {
    const t = computeTimes(30.0444, 31.2357, now, "Egyptian");
    expect(t.fajr.getTime()).toBeLessThan(t.sunrise.getTime());
    expect(t.sunrise.getTime()).toBeLessThan(t.dhuhr.getTime());
    expect(t.dhuhr.getTime()).toBeLessThan(t.asr.getTime());
    expect(t.asr.getTime()).toBeLessThan(t.maghrib.getTime());
    expect(t.maghrib.getTime()).toBeLessThan(t.isha.getTime());
  });
  it("مواقيت القاهرة معقولة (الفجر بين ٣ و٦ صباحاً، المغرب بين ٤ و٨ مساءً)", () => {
    const t = computeTimes(30.0444, 31.2357, now, "Egyptian");
    // نستخدم UTC بتعويض تقريبي للقاهرة (+2)
    const fajrUtc = t.fajr.getUTCHours();
    const maghribUtc = t.maghrib.getUTCHours();
    expect(fajrUtc + 2).toBeGreaterThanOrEqual(3);
    expect(fajrUtc + 2).toBeLessThanOrEqual(6);
    const m = maghribUtc + 2;
    expect(m).toBeGreaterThanOrEqual(16);
    expect(m).toBeLessThanOrEqual(21);
  });
  it("الصلاة القادمة بعد الظهر هي إحدى الصلوات الصحيحة", () => {
    const info = getNextPrayer(30.0444, 31.2357, "Egyptian", now);
    expect(["الظهر", "العصر", "المغرب", "العشاء", "الفجر"]).toContain(info.name);
    expect(info.at.getTime()).toBeGreaterThan(now.getTime() - 24 * 3600 * 1000);
  });
  it("بعد العشاء تعود للفجر (اليوم التالي)", () => {
    const late = new Date("2025-03-10T23:30:00");
    const info = getNextPrayer(30.0444, 31.2357, "Egyptian", late);
    expect(info.name).toBe("الفجر");
  });
});
