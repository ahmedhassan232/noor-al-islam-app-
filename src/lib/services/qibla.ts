// ===== حساب اتجاه القبلة — دائرة عظمى نحو الكعبة المشرفة =====

export const KAABA = { lat: 21.422487, lng: 39.826206 };

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** زاوية القبلة بالدرجات من الشمال الحقيقي باتجاه عقارب الساعة (0–360) */
export function qiblaBearing(lat: number, lng: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA.lat);
  const dLambda = toRad(KAABA.lng - lng);
  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda);
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

/** المسافة إلى الكعبة بالكيلومتر (هافرساين) */
export function distanceToKaaba(lat: number, lng: number): number {
  const R = 6371;
  const dLat = toRad(KAABA.lat - lat);
  const dLng = toRad(KAABA.lng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** الاتجاه البوصلي النصي لزاوية ما */
export function compassPoint(bearing: number): string {
  const points = [
    "شمال", "شمال شرق", "شرق", "جنوب شرق",
    "جنوب", "جنوب غرب", "غرب", "شمال غرب",
  ];
  return points[Math.round((((bearing % 360) + 360) % 360) / 45) % 8];
}
