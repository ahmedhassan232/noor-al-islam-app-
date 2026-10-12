// ===== عناصر صغيرة مساعدة للصفحة الرئيسية =====
"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Ornament } from "@/components/decor";
import { Card } from "@/components/ui";

export { Card };

export function SectionTitle({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5 mt-2">
      <h2 className="text-2xl font-black flex items-center gap-3">
        <span className="w-1.5 h-7 rounded-full bg-gradient-to-b from-[var(--gold)] to-[var(--emerald)]" />
        {title}
      </h2>
      {extra}
    </div>
  );
}

export function OrnamentLite() {
  return <Ornament className="mt-12 opacity-70" />;
}

export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-bold transition-all",
        active
          ? "border-[var(--gold)] text-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_12%,transparent)]"
          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      )}
    >
      {children}
    </button>
  );
}
