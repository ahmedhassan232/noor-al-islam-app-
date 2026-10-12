"use client";
// ===== مزوّدو التطبيق: تفعيل ثيم + تهيئة المشغّل + الهيكل والمشغّل المصغّر =====
import { ReactNode, useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { usePrefs } from "@/lib/services/prefsStore";
import { usePlayer } from "@/lib/services/playerStore";
import AppShell from "@/components/layout/AppShell";
import MiniPlayer from "@/components/audio/MiniPlayer";
import FullPlayer from "@/components/audio/FullPlayer";
import { ToastHost } from "@/components/ui";

function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-16 md:top-4 inset-x-0 z-[60] flex justify-center pointer-events-none px-4">
      <div className="card anim-pop px-4 py-2 flex items-center gap-2 text-sm font-bold !rounded-full border-[color-mix(in_srgb,var(--gold)_40%,transparent)] shadow-xl">
        <WifiOff size={15} className="text-[var(--gold)]" />
        غير متصل — المحتوى المحفوظ محلياً ما زال يعمل
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  const theme = usePrefs((s) => s.theme);
  const init = usePlayer((s) => s.init);

  useEffect(() => {
    // استكمال تهيئة التفضيلات من localStorage بعد التركيب فقط
    void usePrefs.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      <div className="geo-bg">
        <div className="geo-pattern" />
      </div>
      <AppShell>{children}</AppShell>
      <OfflineBanner />
      <MiniPlayer />
      <FullPlayer />
      <ToastHost />
    </>
  );
}
