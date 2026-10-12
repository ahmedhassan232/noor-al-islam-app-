// ===== مكوّنات واجهة مشتركة =====
"use client";
import { ReactNode, useEffect, useRef } from "react";
import { X, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToasts, type Toast } from "@/lib/services/toastStore";

export function Card({
  children,
  className,
  hover = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={cn("card", hover && "card-hover", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <header className="anim-rise mb-8">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--emerald)_18%,transparent)] text-[var(--gold)] border border-[var(--line)]">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="text-[var(--muted)] mt-1">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="anim-fade card p-12 text-center">
      <div className="mx-auto w-14 h-14 grid place-items-center rounded-2xl text-[var(--gold)] border border-[var(--line)] bg-[color-mix(in_srgb,var(--gold)_8%,transparent)]">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      {hint && <p className="mt-2 text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="anim-fade card p-10 text-center border-[color-mix(in_srgb,var(--danger)_35%,transparent)]">
      <AlertCircle className="mx-auto text-[var(--danger)]" size={36} />
      <p className="mt-4 text-lg font-bold">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost mt-6">
          <RefreshCw size={18} />
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function Modal({
  open,
  onClose,
  children,
  title,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-end sm:place-items-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fade"
      />
      <div
        ref={ref}
        className={cn(
          "relative w-full card !rounded-b-none sm:!rounded-b-[20px] max-h-[92dvh] overflow-y-auto anim-slide-sheet sm:anim-pop shadow-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)] sticky top-0 bg-[var(--surface)] z-10">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="icon-btn" aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="fixed bottom-24 md:bottom-8 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((t: Toast) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto card px-5 py-3 flex items-center gap-3 anim-pop shadow-xl !rounded-2xl border",
            t.tone === "ok" && "border-[color-mix(in_srgb,var(--ok)_45%,transparent)]",
            t.tone === "error" && "border-[color-mix(in_srgb,var(--danger)_45%,transparent)]"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              t.tone === "ok" ? "bg-[var(--ok)]" : t.tone === "error" ? "bg-[var(--danger)]" : "bg-[var(--gold)]"
            )}
          />
          <span className="font-semibold text-sm">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label="إخفاء"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 8,
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--muted) 18%, transparent)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: "stroke-dashoffset .5s cubic-bezier(.22,1,.36,1)" }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--emerald)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
