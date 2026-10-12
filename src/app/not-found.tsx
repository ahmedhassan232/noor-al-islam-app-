import Link from "next/link";
import { Logo } from "@/components/decor";

export default function NotFound() {
  return (
    <div className="min-h-[70dvh] grid place-items-center text-center px-6">
      <div className="anim-pop">
        <Logo size={90} className="mx-auto" />
        <p className="mt-6 text-7xl font-black gold-text" style={{ fontFamily: "var(--font-kufi)" }}>
          ٤٠٤
        </p>
        <h1 className="mt-3 text-2xl font-black">الصفحة غير موجودة</h1>
        <p className="mt-2 text-[var(--muted)]">
          «فَإِنَّ مَعَ الْعُسْرِ يُسْرًا» — جرّب العودة للرئيسية
        </p>
        <Link href="/" className="btn btn-primary mt-7 inline-flex">
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
