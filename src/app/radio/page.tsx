"use client";
// ===== الإذاعة الإسلامية — بث مباشر موثق =====
import {
  Radio as RadioIcon,
  Play,
  Pause,
  Loader2,
  RefreshCw,
  BadgeCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { Card } from "@/components/homebits";
import { RADIO_STATIONS } from "@/lib/data/audio";
import { usePlayer } from "@/lib/services/playerStore";
import { cn } from "@/lib/utils";

export default function RadioPage() {
  const p = usePlayer();

  return (
    <div>
      <PageHeader
        title="الإذاعة الإسلامية"
        subtitle="بث مباشر موثق عبر HTTPS — تم التحقق من عمل كل محطة قبل إضافتها"
        icon={<RadioIcon size={26} />}
      />

      <div className="card p-4 mb-8 text-sm text-[var(--muted)] leading-relaxed anim-rise">
        تشغيل الإذاعة يوقف أي تلاوة جارية تلقائياً (مشغّل واحد آمن). المحطات
        من شبكة Qurango الموثقة. إن تعذّر الاتصال بمحطة فستظهر رسالة واضحة مع
        زر إعادة المحاولة — لا نعرض محطة تعمل وهي معطلة.
      </div>

      <div className="grid gap-4 md:grid-cols-2 stagger">
        {RADIO_STATIONS.map((s) => {
          const active = p.track?.kind === "radio" && p.track.stationId === s.id;
          const busy = active && (p.status === "loading" || p.status === "buffering");
          const playing = active && p.status === "playing";
          const failed = active && p.status === "error";
          return (
            <Card
              key={s.id}
              hover
              className={cn(
                "p-6",
                active && "border-[var(--line-strong)] bg-[color-mix(in_srgb,var(--emerald)_8%,var(--surface))]"
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "relative grid place-items-center w-14 h-14 rounded-2xl border shrink-0",
                    active
                      ? "bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white border-transparent"
                      : "border-[var(--line)] text-[var(--gold)] bg-[var(--surface-2)]"
                  )}
                >
                  {playing && (
                    <span className="absolute inset-0 rounded-2xl border-2 border-[var(--gold)] animate-[pulse-ring_1.6s_ease-out_infinite]" />
                  )}
                  <RadioIcon size={24} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black">{s.name}</h3>
                  <p className="text-sm text-[var(--muted)] truncate">{s.description}</p>
                  <p className="mt-1 text-xs font-bold flex items-center gap-1.5">
                    {playing ? (
                      <span className="text-[var(--danger)] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
                        يبث الآن
                      </span>
                    ) : failed ? (
                      <span className="text-[var(--danger)]">تعذّر الاتصال</span>
                    ) : (
                      <span className="text-[var(--ok)] flex items-center gap-1">
                        <BadgeCheck size={13} /> بث موثق
                      </span>
                    )}
                  </p>
                </div>
                {failed ? (
                  <button
                    onClick={() => p.retry()}
                    className="btn btn-ghost !px-4 !py-2 text-sm shrink-0"
                  >
                    <RefreshCw size={15} />
                    إعادة
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      playing || busy ? p.pause() : p.playRadio({ id: s.id, name: s.name, url: s.url })
                    }
                    aria-label={playing ? "إيقاف البث" : busy ? "جارٍ الاتصال" : `تشغيل ${s.name}`}
                    className={cn(
                      "grid place-items-center w-12 h-12 rounded-full shrink-0 transition-transform active:scale-90",
                      active
                        ? "bg-[var(--gold)] text-[#10210f]"
                        : "bg-gradient-to-br from-[var(--emerald)] to-[var(--emerald-deep)] text-white"
                    )}
                  >
                    {busy ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : playing ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} className="ms-0.5" />
                    )}
                  </button>
                )}
              </div>
              {failed && (
                <p className="mt-3 text-xs text-[var(--danger)]">{p.error}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
