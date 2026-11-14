import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "نور الإسلام — القرآن والأذكار والسنة",
    template: "%s | نور الإسلام",
  },
  description:
    "تطبيق إسلامي شامل: القرآن الكريم قراءةً واستماعاً بأصوات نديّة، أحاديث موثقة، أذكار، مواقيت الصلاة، اتجاه القبلة، وإذاعات قرآنية.",
  applicationName: "نور الإسلام",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "نور الإسلام", statusBarStyle: "black-translucent" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#071510",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
  lang="ar"
  dir="rtl"
  data-scroll-behavior="smooth"
  suppressHydrationWarning
>
      <head>
        {/* استعادة الثيم قبل الرسم لتفادي الوميض — عبر next/script الرسمي */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var p=JSON.parse(localStorage.getItem('noor-prefs-v1')||'{}');var t=p&&p.state&&p.state.theme;if(t)document.documentElement.dataset.theme=t}catch(e){}`}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Cairo:wght@300;400;500;600;700;800;900&family=Reem+Kufi:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
