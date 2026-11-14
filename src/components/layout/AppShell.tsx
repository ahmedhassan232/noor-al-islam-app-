"use client";
// ===== هيكل التطبيق: شريط جانبي للشاشات الكبيرة وتنقّل سفلي للجوال =====
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  ScrollText,
  Sparkles,
  MoonStar,
  Compass,
  Radio,
  Star,
  Settings,
  Search,
  MoreHorizontal,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/decor";
import { usePrefs } from "@/lib/services/prefsStore";
import SearchModal from "@/components/SearchModal";
import MoreSheet from "@/components/layout/MoreSheet";
import InstallPrompt from "@/components/pwa/InstallPrompt";

const NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/quran", label: "القرآن الكريم", icon: BookOpen },
  { href: "/hadith", label: "الأحاديث", icon: ScrollText },
  { href: "/adhkar", label: "الأذكار", icon: Sparkles },
  { href: "/prayer", label: "مواقيت الصلاة", icon: MoonStar },
  { href: "/qibla", label: "القبلة", icon: Compass },
  { href: "/radio", label: "الإذاعة", icon: Radio },
  { href: "/favorites", label: "المفضلة", icon: Star },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

const MOBILE_NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/quran", label: "القرآن", icon: BookOpen },
  { href: "/hadith", label: "الأحاديث", icon: ScrollText },
  { href: "/adhkar", label: "الأذكار", icon: Sparkles },
];

function ThemeToggle() {
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  return (
    <button
      className="icon-btn"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
      title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="relative z-10 min-h-dvh">
      {/* ===== الشريط الجانبي — الشاشات المتوسطة فأعلى ===== */}
      <aside className="hidden md:flex fixed inset-y-0 start-0 w-[272px] flex-col border-e border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-2)_82%,transparent)] backdrop-blur-xl z-40">
        <Link href="/" className="flex items-center gap-3 px-6 pt-7 pb-6">
          <Logo size={46} />
          <div>
            <p className="text-2xl font-black leading-tight gold-text" style={{ fontFamily: "var(--font-kufi)" }}>
              نور الإسلام
            </p>
            <p className="text-[11px] text-[var(--muted)] tracking-widest">NOOR AL-ISLAM</p>
          </div>
        </Link>

        <button
          onClick={() => setSearchOpen(true)}
          className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--muted)] hover:border-[var(--line-strong)] transition-colors"
        >
          <Search size={17} />
          <span className="text-sm font-semibold">بحث شامل…</span>
          <kbd className="ms-auto text-[10px] border border-[var(--line)] rounded-md px-1.5 py-0.5">Ctrl K</kbd>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1" aria-label="التنقل الرئيسي">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 font-bold transition-all duration-300",
                  active
                    ? "text-[var(--ink)] bg-[color-mix(in_srgb,var(--emerald)_16%,transparent)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
                )}
              >
                <span
                  className={cn(
                    "absolute start-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-[var(--gold)] to-[var(--emerald)] transition-all duration-300",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
                <item.icon
                  size={20}
                  className={cn(active ? "text-[var(--gold)]" : "text-[var(--muted)] group-hover:text-[var(--ink)]")}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-[var(--line)] flex items-center justify-between">
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ»
          </p>
          <ThemeToggle />
        </div>
      </aside>

      {/* ===== ترويسة الجوال ===== */}
      <header
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur-xl"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={36} />
          <p className="text-xl font-black gold-text" style={{ fontFamily: "var(--font-kufi)" }}>
            نور الإسلام
          </p>
        </Link>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="بحث">
            <Search size={20} />
          </button>
          <Link href="/settings" className="icon-btn" aria-label="الإعدادات">
            <Settings size={20} />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <InstallPrompt />

      {/* ===== المحتوى ===== */}
      <main className="md:ps-[272px]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-40 pt-5 md:px-8 md:pb-32 md:pt-9 flex flex-col min-h-[calc(100dvh-10rem)]">
          <div className="flex-1">
            {children}
          </div>
          <div className="mt-16 pt-6 border-t border-[var(--line)] text-center text-xs text-[var(--muted)] font-medium">
            by :Ahmed Hassan Sayed
          </div>
        </div>
      </main>

      {/* ===== التنقّل السفلي للجوال ===== */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-2)_88%,transparent)] backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="التنقل السفلي"
      >
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={cn(
                    "absolute -top-px h-[3px] w-8 rounded-full bg-gradient-to-l from-[var(--gold)] to-[var(--emerald)] transition-all duration-300",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <item.icon size={21} className={active ? "text-[var(--gold)]" : "text-[var(--muted)]"} />
                <span className={cn("text-[10px] font-bold", active ? "text-[var(--ink)]" : "text-[var(--muted)]")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="relative flex min-h-[58px] flex-col items-center justify-center gap-1 py-2.5"
            aria-label="المزيد"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={21} className={moreOpen ? "text-[var(--gold)]" : "text-[var(--muted)]"} />
            <span className={cn("text-[10px] font-bold", moreOpen ? "text-[var(--ink)]" : "text-[var(--muted)]")}>
              المزيد
            </span>
          </button>
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
