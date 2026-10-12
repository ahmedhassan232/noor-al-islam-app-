// ===== عناصر الهوية والزخرفة =====
import { cn } from "@/lib/utils";

/** شعار نور الإسلام — نجمة ثمانية وهلال */
export function Logo({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8D5A8" />
          <stop offset="55%" stopColor="#D6B46A" />
          <stop offset="100%" stopColor="#B9964F" />
        </linearGradient>
        <radialGradient id="lg-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#16A36A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#16A36A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#lg-glow)" />
      <path
        d="M32 6l6.4 13.2L52.4 21l-9 11.4 2.9 14.8L32 40.6l-14.3 6.6 2.9-14.8-9-11.4 14-1.8z"
        fill="none"
        stroke="url(#lg-gold)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M38.5 32a9.5 9.5 0 1 1-9.4-9.5 7.6 7.6 0 1 0 9.4 9.5z"
        fill="url(#lg-gold)"
      />
      <circle cx="41.5" cy="25.5" r="2.1" fill="url(#lg-gold)" />
    </svg>
  );
}

/** فاصل زخرفي بنقشة */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn("ornament-line", className)} aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.6 5.4L20 8.4l-4 4.4 1 6.2-5-3.2-5 3.2 1-6.2-4-4.4 5.4-1z" opacity="0.9" />
      </svg>
    </div>
  );
}

/** أيقونة عدد السورة داخل نجمة مثمّنة */
export function SurahBadge({
  n,
  size = 52,
  active = false,
}: {
  n: number | string;
  size?: number;
  active?: boolean;
}) {
  const label = typeof n === "number" ? toAr(n) : n;
  return (
    <div
      className="relative grid place-items-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        className={cn(
          "absolute inset-0 transition-transform duration-500",
          active && "rotate-45"
        )}
      >
        <rect
          x="14"
          y="14"
          width="36"
          height="36"
          rx="7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-[var(--gold)]"
          opacity="0.85"
        />
        <rect
          x="14"
          y="14"
          width="36"
          height="36"
          rx="7"
          fill="color-mix(in srgb, var(--gold) 7%, transparent)"
          stroke="currentColor"
          strokeWidth="1.6"
          className="text-[var(--gold)]"
          transform="rotate(45 32 32)"
        />
      </svg>
      <span className="relative font-bold text-[var(--gold)]" style={{ fontSize: size * 0.32 }}>
        {label}
      </span>
    </div>
  );
}

function toAr(n: number): string {
  const m = "٠١٢٣٤٥٦٧٨٩";
  return String(n).replace(/\d/g, (d) => m[Number(d)]);
}

/** زخرفة نجمية دوّارة للخلفيات */
export function SpinningStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("anim-spin-slow text-[var(--gold)] opacity-[0.10]", className)}
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 100 100)`}>
          <path
            d="M100 22 L114 78 L100 100 L86 78 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </g>
      ))}
      <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeDasharray="2 7" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
