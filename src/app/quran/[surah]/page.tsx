import QuranReaderClient from "@/components/quran/QuranReaderClient";
import { notFound } from "next/navigation";
import { SURAHS } from "@/lib/data/surahs";

export function generateStaticParams() {
  return SURAHS.map((surah) => ({ surah: String(surah.n) }));
}

export default async function QuranReaderPage({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const { surah } = await params;
  const number = Number(surah);
  const exists = Number.isInteger(number) && number >= 1 && number <= SURAHS.length;

  if (!exists) {
    notFound();
  }

  return <QuranReaderClient n={number} />;
}
