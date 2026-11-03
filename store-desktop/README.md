# Australian Bite Store POS

Windows desktop point-of-sale application for Australian Bite. It is a separate Tauri 2 + React app and shares the existing Australian Bite Supabase project.

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

## Automatic updates

- The app checks GitHub Releases at startup and every four hours while running.
- Publish a Windows POS release with a tag in the format `store-v0.1.1` (increase the semantic version for each release). The Windows release workflow builds the installer and uploads its SHA-256 checksum beside it.
- When a newer release is found, the POS displays an **Update** action. Choosing it downloads the installer, verifies its SHA-256 checksum, silently installs it, and restarts the POS. Local app settings remain in the app's normal Windows user-data directory.
- The update checker only accepts newer semantic versions from this repository's latest GitHub Release.
## Order safety

- Online orders are read from the existing `orders` table and updated only through existing validated status RPCs.
- Counter orders use the `place_counter_order` RPC, which checks Store/Admin role and delegates price, add-on, offer, and idempotency validation to the existing `place_order` database function.
- Print attempts are recorded in `store_print_jobs`; print failures do not recreate or modify orders.

## First-release scope

- Counter sales use the existing server-validated menu, add-on, delivery-fee, COD/prepaid, and order-idempotency rules.
- Counter coupon/BOGO redemption is intentionally not enabled yet. The existing website redemption model is tied to authenticated customer accounts; the POS needs phone/guest-based redemption tracking before staff can safely apply those offers without consuming a redemption against the staff account. Website coupons and BOGO remain unchanged.
- This application requires an internet connection for authentication and order creation/updates. Offline order creation is intentionally not enabled in the first release.
