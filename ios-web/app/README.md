# iOS shell (Capacitor 8)

The app lives in `../src`; this folder wraps the built page in a native iOS app. Setup and the shipping pipeline are in `../PLAYBOOK.md`.

What the shell adds to the web build:
- Saves mirrored to native storage through `@capacitor/preferences` (`www/native.js`): iOS can evict WebView localStorage, Preferences survive. Every key starting with the app's storage prefix is mirrored, and an older localStorage value is copied across on first launch.
- Haptics through `@capacitor/haptics`, wired to `window.lbHaptic(kind)`; a dark status bar and splash.
- `www/native.js` calls plugins through the bridge the WebView injects, `Capacitor.nativePromise(plugin, method, options)`, after `Capacitor.isPluginAvailable()`. The app has no bundler, so `@capacitor/core`'s `registerPlugin` and `Capacitor.Plugins` do not exist there and calls through them fail silently. Keep it that way when adding a plugin (and add the plugin to `package.json`, then `npx cap sync`).

## Scripts (`cd app`)
| | |
|---|---|
| `npm ci` | install (Xcode Cloud does this too; `package-lock.json` is committed) |
| `npm run add-ios` | once: build `www/`, `npx cap add ios`, then `../tools/ios-setup.mjs` (ci_scripts, privacy manifest, shared scheme, ExportOptions.plist, bundle id, team, no export compliance question). Works on Linux. |
| `npm run assets` | draw `assets/icon.png` and `splash.png` (`../tools/assets.mjs`), then `capacitor-assets generate --ios` |
| `npm run sync` | build `www/` and copy it into `ios/`: always before any xcodebuild, or the archive ships the previous build |
| `npm run ios` | sync and open Xcode |
| `npm run ship` | Mac fallback: sync, archive, check the build id in the archive, upload with the Admin API key (`ship-ios.sh`) |

## On a device from the Mac
`npm run ios`, pick the team under the App target → Signing & Capabilities, plug in the phone and press Run. First time only: turn on Developer Mode on the phone (Settings → Privacy & Security; it restarts), and trust the developer (Settings → General → VPN & Device Management). The Simulator's WebView takes 15 to 20 seconds to paint its first frame; wait before judging it.

## Icons and splash
The splash is shown aspect-fill, so a phone sees only about the central 46% of the 2732 px square in either orientation: keep the title inside the central 38% (`tools/assets.mjs` does). Replace its art with the app's own, then `npm run assets` and commit `assets/` and `ios/App/App/Assets.xcassets`.

## Android (later)
`npm i @capacitor/android && npx cap add android && npx cap open android` (needs Android Studio); `npm run sync` then covers both.
