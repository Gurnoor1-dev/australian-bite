# Australian Bite Store POS

A shared Tauri 2 + React point-of-sale application for Windows desktop and Android phones/tablets. Both editions use the same Australian Bite Supabase project and POS codebase.

## Requirements

- Windows 10/11 (64-bit)
- Node.js 20+ and npm
- Rust stable toolchain
- Microsoft C++ Build Tools (Visual Studio Build Tools)
- WebView2 Runtime
- A Windows-installed thermal printer (USB, LAN, or Bluetooth printer exposed as a Windows printer queue)

## Configure

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The publishable key is safe for client applications; never use a service-role key here.
3. Install dependencies: `npm install`.
4. Run in development: `npm run tauri dev`.
5. Build the Windows installer: `npm run build`.

## Access

Sign in using an existing Australian Bite account with the `store` or `admin` role. The app does not create a separate user database.

## Printing

- Thermal receipt printers use the Windows spooler RAW path and ESC/POS commands. Install the manufacturer's Windows driver, select the printer in **Printer settings**, and use **Print test receipt** before live service.
- Microsoft Print to PDF and other PDF/document printers use a separate HTML print document (never RAW ESC/POS bytes). The PDF path uses a standard A4 page with the Australian Bite logo, so the resulting file is a normal, readable PDF. In the Windows print dialog choose **Microsoft Print to PDF**, then save the file.
- The POS logo is used in the sign-in screen, sidebar, PDF receipts, and the Windows application icon.

## Windows and Android builds

- Windows desktop installers are built by GitHub Actions on a release tag.
- Android APKs are built from the same POS frontend using Tauri Android. The mobile layout is touch-first and adapts the order desk, counter, kitchen, menu, and settings screens to phone and tablet sizes.
- Branch pushes run validation only; they do not publish installer downloads.
- Publish only major POS releases using tags such as `store-v1.0.0`, `store-v2.0.0`, etc. Each eligible major release publishes one Windows NSIS setup `.exe` and one signed Android `.apk` together.
- The Settings screen has a manual **Check for updates** action. It only offers a newer major release. Windows verifies and installs the setup package; Android opens the signed APK download so Android's package installer can complete the update.
- Android APKs must always use the same keystore. Store the signing material in GitHub Actions secrets; never commit the keystore or `keystore.properties`.

### Required GitHub Actions secrets for Android releases

- `ANDROID_KEY_BASE64`: base64-encoded persistent JKS keystore.
- `ANDROID_KEY_PASSWORD`: keystore/key password.
- `ANDROID_KEY_ALIAS`: key alias.

Generate and back up the Android keystore once. Losing it prevents future APK updates over existing installations.

## Android development

- Install Android Studio, Android SDK/NDK, Java 17+, Node.js, and Rust.
- From `store-desktop`, run `npm install`, then `npm run android:init` once.
- Connect an Android device with USB debugging enabled and run `npm run tauri android dev`.
- For a release APK, use `npm run android:build` after configuring the Android signing key.

## Updates

Only major version releases produce downloadable installers. A normal branch push does not create a new EXE or APK. Use the in-app Settings button to check for the next major release.

## Order safety

- Online orders are read from the existing `orders` table and updated only through existing validated status RPCs.
- Counter orders use the `place_counter_order` RPC, which checks Store/Admin role and delegates price, add-on, offer, and idempotency validation to the existing `place_order` database function.
- Print attempts are recorded in `store_print_jobs`; print failures do not recreate or modify orders.

## First-release scope

- Counter sales use the existing server-validated menu, add-on, delivery-fee, COD/prepaid, and order-idempotency rules.
- Counter coupon/BOGO redemption is intentionally not enabled yet. The existing website redemption model is tied to authenticated customer accounts; the POS needs phone/guest-based redemption tracking before staff can safely apply those offers without consuming a redemption against the staff account. Website coupons and BOGO remain unchanged.
- This application requires an internet connection for authentication and order creation/updates. Offline order creation is intentionally not enabled in the first release.
