"use client";

import { useEffect, useState } from "react";
import { Download, MoreVertical, Plus, Share2, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
};

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/i.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const mobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
      window.matchMedia("(max-width: 767px) and (pointer: coarse)").matches;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsIOS(ios);

    let dismissedThisSession = false;
    try {
      dismissedThisSession = window.sessionStorage.getItem("noor-install-dismissed") === "1";
    } catch {
      // Storage may be unavailable in private browsing; the prompt can still work.
    }

    if (mobile && !standalone && !dismissedThisSession) {
      setVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
      if (mobile && !standalone) setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      setGuideOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem("noor-install-dismissed", "1");
    } catch {
      // Ignore storage errors; dismissal still applies for this page view.
    }
  };

  const install = async () => {
    if (!deferredPrompt) {
      setGuideOpen(true);
      return;
    }

    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setGuideOpen(false);
      } else {
        setGuideOpen(true);
      }
    } catch {
      setGuideOpen(true);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="md:hidden px-4 pt-3">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-3 shadow-[var(--shadow-soft)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--gold)_15%,transparent)] text-[var(--gold)]">
            <Download size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[var(--ink)]">ثبّت تطبيق نور الإسلام</p>
            <p className="mt-0.5 text-[11px] leading-5 text-[var(--muted)]">
              أضفه إلى الشاشة الرئيسية للوصول إليه بسهولة.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              type="button"
              onClick={install}
              className="rounded-xl bg-[var(--emerald)] px-3 py-2 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
            >
              تثبيت
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-[10px] font-semibold text-[var(--muted)]"
            >
              ليس الآن
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="إغلاق اقتراح التثبيت"
            className="self-start rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--surface-2)]"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {guideOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="noor-install-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setGuideOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl border border-[var(--line-strong)] bg-[var(--bg-2)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--gold)_15%,transparent)] text-[var(--gold)]">
                  <Download size={20} />
                </div>
                <h2 id="noor-install-title" className="text-base font-extrabold text-[var(--ink)]">
                  تثبيت نور الإسلام
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="إغلاق"
                className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface)]"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm leading-7 text-[var(--ink)]">
                <p className="text-[var(--muted)]">لتثبيت الموقع على iPhone أو iPad:</p>
                <div className="flex items-start gap-3 rounded-xl bg-[var(--surface)] p-3">
                  <Share2 className="mt-1 shrink-0 text-[var(--gold)]" size={20} />
                  <p>افتح قائمة المشاركة في المتصفح.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-[var(--surface)] p-3">
                  <Plus className="mt-1 shrink-0 text-[var(--gold)]" size={20} />
                  <p>اختر «إضافة إلى الشاشة الرئيسية»، ثم اضغط «إضافة».</p>
                </div>
                <p className="text-xs text-[var(--muted)]">يفضّل استخدام Safari إذا لم يظهر خيار الإضافة في متصفحك.</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm leading-7 text-[var(--ink)]">
                <p className="text-[var(--muted)]">إذا لم تظهر نافذة التثبيت التلقائية:</p>
                <div className="flex items-start gap-3 rounded-xl bg-[var(--surface)] p-3">
                  <MoreVertical className="mt-1 shrink-0 text-[var(--gold)]" size={20} />
                  <p>افتح قائمة المتصفح (⋮) أعلى الشاشة.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-[var(--surface)] p-3">
                  <Plus className="mt-1 shrink-0 text-[var(--gold)]" size={20} />
                  <p>اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» ثم أكّد الإضافة.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="mt-5 w-full rounded-xl bg-[var(--emerald)] px-4 py-3 text-sm font-extrabold text-white"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
