import type { NextConfig } from "next";

// عند CAP_EXPORT=1 يُبنى التطبيق كملفات ثابتة في out/ لاستخدامها مع Capacitor
const isCapExport = process.env.CAP_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isCapExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
