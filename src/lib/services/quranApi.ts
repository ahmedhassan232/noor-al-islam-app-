// ===== مزوّد نص القرآن الكريم =====
// المصدر: AlQuran Cloud (api.alquran.cloud) — رواية حفص، الرسم العثماني.
// يُخزَّن النص محلياً في IndexedDB بعد أول جلب ناجح.
import { fetchWithTimeout } from "../utils";
import { idbGet, idbSet } from "./storage";
import { getSurah, type AyahText } from "../data/surahs";

const API = "https://api.alquran.cloud/v1";
const EDITIONS = ["quran-uthmani", "quran-simple"] as const;

export interface SurahContent {
  surah: number;
  edition: string;
  ayahs: AyahText[];
}

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
}
interface ApiResponse {
  code: number;
  status: string;
  data: {
    number: number;
    numberOfAyahs: number;
    ayahs: ApiAyah[];
  };
}

/** التحقق الصارم من استجابة المزوّد قبل العرض */
function validate(data: unknown, surah: number): AyahText[] | null {
  const meta = getSurah(surah);
  if (!meta) return null;
  const res = data as ApiResponse;
  if (!res || res.code !== 200 || !res.data) return null;
  if (res.data.number !== surah) return null;
  if (!Array.isArray(res.data.ayahs) || res.data.ayahs.length !== meta.ayahs)
    return null;
  const ayahs: AyahText[] = [];
  for (let i = 0; i < res.data.ayahs.length; i++) {
    const a = res.data.ayahs[i];
    if (typeof a?.text !== "string" || a.text.trim() === "") return null;
    if (typeof a.numberInSurah !== "number") return null;
    ayahs.push({ numberInSurah: a.numberInSurah, text: a.text });
  }
  return ayahs;
}

async function fetchEdition(
  surah: number,
  edition: string,
  signal?: AbortSignal
): Promise<AyahText[] | null> {
  const res = await fetchWithTimeout(
    `${API}/surah/${surah}/${edition}`,
    { signal, cache: "force-cache" },
    15000
  );
  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  return validate(json, surah);
}

/** جلب نص السورة: الكاش أولاً ثم الشبكة، مع مصدر احتياطي للرسم */
export async function getSurahText(
  surah: number,
  signal?: AbortSignal
): Promise<SurahContent> {
  const cacheKey = `surah-${surah}`;
  const cached = await idbGet<SurahContent>(cacheKey);
  if (cached && cached.ayahs?.length === getSurah(surah)?.ayahs) {
    return cached;
  }
  let lastError: Error | null = null;
  for (const edition of EDITIONS) {
    try {
      const ayahs = await fetchEdition(surah, edition, signal);
      if (ayahs) {
        const content: SurahContent = { surah, edition, ayahs };
        void idbSet(cacheKey, content);
        return content;
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw (
    lastError ??
    new Error("تعذّر تحميل نص السورة. تحقّق من الاتصال بالإنترنت وحاول مجدداً.")
  );
}

/** نص البسملة بالرسم العثماني كما يرد من المزوّد */
const BASMALA_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/**
 * يفصل البسملة عن متن الآية الأولى (للسور غير الفاتحة والتوبة)
 * حتى تُعرض البسملة كترويسة مستقلة كما في المصحف.
 */
export function splitBasmala(surah: number, firstAyah: string): string {
  if (surah === 1 || surah === 9) return firstAyah;
  if (firstAyah.startsWith(BASMALA_UTHMANI)) {
    const rest = firstAyah.slice(BASMALA_UTHMANI.length).trim();
    if (rest.length > 0) return rest;
  }
  return firstAyah;
}

export { BASMALA_UTHMANI };
