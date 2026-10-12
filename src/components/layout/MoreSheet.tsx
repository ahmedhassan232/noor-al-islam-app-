"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MoonStar, Radio, Settings, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MORE_DESTINATIONS = [
  { href: "/prayer", label: "مواقيت الصلاة", hint: "المواقيت والحساب", icon: MoonStar },
  { href: "/qibla", label: "القبلة", hint: "الاتجاه والمعايرة", icon: Compass },
  { href: "/radio", label: "الإذاعة", hint: "بث قرآني مباشر", icon: Radio },
  { href: "/favorites", label: "المفضلة", hint: "محفوظاتك", icon: Star },
  { href: "/settings", label: "الإعدادات", hint: "التفضيلات والتنزيلات", icon: Settings },
];

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MoreSheet({ open, onClose }: MoreSheetProps) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="المزيد">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="إغلاق قائمة المزيد"
        onClick={onClose}
      />
      <section className="absolute bottom-0 inset-x-0 rounded-t-[28px] border-t border-[var(--line-strong)] bg-[var(--bg-2)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl anim-slide-sheet">
        <div className="mx-auto h-1.5 w-11 rounded-full bg-[var(--line-strong)]" />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">المزيد</h2>
            <p className="mt-0.5 text-sm text-[var(--muted)]">كل ما تحتاجه ليومك الإيماني</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-4 grid grid-cols-2 gap-3" aria-label="مزيد من الوجهات">
          {MORE_DESTINATIONS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex min-h-[86px] items-center gap-3 rounded-2xl border p-3 transition-colors",
                  active
                    ? "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_11%,var(--surface))]"
                    : "border-[var(--line)] bg-[var(--surface)] active:bg-[var(--surface-2)]"
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--emerald)_15%,transparent)] text-[var(--gold)]">
                  <item.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{item.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{item.hint}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </section>
    </div>
  );
}
