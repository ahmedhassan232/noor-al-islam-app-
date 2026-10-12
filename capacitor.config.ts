import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor Android — نور الإسلام
 *
 * البناء لأندرويد (يتطلب Android Studio):
 *   1) CAP_EXPORT=1 npm run build     ← بناء الويب كملفات ثابتة في out/
 *   2) npx cap add android            ← مرة واحدة فقط
 *   3) npx cap sync android
 *   4) npx cap open android           ← ثم Build APK من Android Studio
 */
const config: CapacitorConfig = {
  appId: "com.noorislam.app",
  appName: "نور الإسلام",
  webDir: "out",
  backgroundColor: "#071510",
  android: {
    allowMixedContent: false,
  },
};

export default config;
