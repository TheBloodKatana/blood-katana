# Blood Katana for Android

This folder is the Android app: the game (`www/index.html`) inside a Capacitor shell.
The game itself runs offline and keeps saves on the phone. It uses the internet only for optional rewarded ads (Google AdMob) and Google Play Billing. Permissions: internet (ads and billing) and vibration (optional haptics).

- App id: `com.weirdanimations.bloodkatana` (change it in `capacitor.config.json` and `android/app/build.gradle` **before** your first upload to Google Play; it can never change after).
- Version: 1.0.0 (versionCode 1). Bump both in `android/app/build.gradle` for every upload.
- Landscape only, full screen, screen stays awake, Android back button opens the pause menu.
- Targets Android 16 (API 36), runs on Android 7.0 (API 24) and newer.

## The game's source
`game-src/src` holds the game split into modules; `game-src/build.py` joins them into one HTML file. `www/index.html` is that built file, and it is what the app runs.

## Updating the game inside the app
Copy the newest `blood-katana.html` over `www/index.html`, then run `npx cap sync android` (or just push: the GitHub workflow syncs for you).

## Build option A: GitHub (no Android Studio needed)
1. Make a GitHub repository and push this folder to its `main` branch.
2. Open the repository's **Actions** tab. The "Android build" workflow runs on every push (or press "Run workflow").
3. When it finishes, download **blood-katana-debug-apk** from the run page. That APK installs on any Android phone (allow "install unknown apps" for your browser or file manager).

### Signed builds for Google Play
Create your upload key once, on your own computer (keep the file and passwords safe forever, and never commit them):

```
keytool -genkeypair -v -keystore bloodkatana-upload.keystore -alias bloodkatana -keyalg RSA -keysize 2048 -validity 10000
```

Then in the repository: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `BK_KEYSTORE_B64` | the keystore file as base64 (`base64 -w0 bloodkatana-upload.keystore` on Linux, `certutil -encode` on Windows, then paste the text) |
| `BK_KEYSTORE_PASSWORD` | the keystore password |
| `BK_KEY_ALIAS` | `bloodkatana` |
| `BK_KEY_PASSWORD` | the key password |

The next run also uploads **blood-katana-release** with the `.aab` (upload this to Google Play) and a signed `.apk`.

## Build option B: Android Studio
1. Install Node.js 22+ and Android Studio.
2. In this folder: `npm install`, then `npx cap sync android`, then `npx cap open android`.
3. Android Studio: **Build → Build App Bundle(s) / APK(s)**. For Play, use **Build → Generate Signed App Bundle** with your upload key.

## Google Play checklist
- Developer account (one-time US$25). New personal accounts must run a closed test with testers for 14 days before going to production; check the current rule in the Play Console.
- Use Play App Signing (the default) and upload the `.aab`.
- Store listing texts (English, Portuguese, Spanish), the 512 icon, the 1024×500 feature graphic and six 16:9 screenshots are in `store/`. `store/listing.md` also has answers for the content rating and Data safety forms.
- Privacy policy: host `store/privacy-policy.html` somewhere public (GitHub Pages works) and paste its URL in the Play Console.
- Ads: the AdMob **test** app id is in `android/app/src/main/res/values/strings.xml` and the test rewarded unit is `ADMOB_REWARDED` in the game's `06e_shop.js`. Create your AdMob app, then replace both before release (ads on a real id before review can get your AdMob account limited, so keep the test ids while testing).
- In-app products: create the product ids listed in `store/listing.md` in Play Console. Billing only works for builds installed from a Play test track, not sideloaded APKs. Until then the game shows a clearly labelled test purchase.
- Data safety and the "Contains ads" declaration: see `store/listing.md`.
- Content rating questionnaire: fantasy violence with blood; simulated gambling **yes** (a dice game and a prize spin for in-game items, no real money); no user-generated content; in-app purchases **yes**.
- **Turn the cheats off.** Test builds show a Cheats section in Settings (invincible, one-hit kills, endless money, unlock everything). Set `CHEATS_BUILD=false` near the top of `game-src/src/06d_app.js`, rebuild the game with `python3 game-src/build.py`, and copy the result to `www/index.html` before you build the release.
