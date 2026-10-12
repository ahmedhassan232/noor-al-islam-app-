# Android build

The Android application ID is `com.noorislam.app` and the app name is `نور الإسلام`.

## Requirements

- Node.js 20+
- JDK 17, with `JAVA_HOME` pointing to the JDK installation
- Android Studio with Android SDK Platform 35 and Build Tools installed

## Debug APK

From the project root in PowerShell:

```powershell
$env:CAP_EXPORT = "1"
npm.cmd run build
npx.cmd cap sync android
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
```

The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Release build

Create and securely store a signing key, configure its credentials outside source control (for example in `android/keystore.properties`), then run:

```powershell
Push-Location android
.\gradlew.bat bundleRelease
Pop-Location
```

The release AAB is generated at `android/app/build/outputs/bundle/release/app-release.aab` after signing is configured.

## Architecture notes

- Capacitor loads the static `out/` export, including all 114 pre-rendered Quran reader routes.
- Quran text, user preferences, bookmarks, and audio cache retain their existing client-side persistence behavior.
- `/api/health` is a static bundle-health response so it remains compatible with offline Capacitor packaging; no UI route depends on a server database.
