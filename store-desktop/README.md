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

The Windows Rust command sends ESC/POS bytes directly to the selected Windows printer queue using the Windows spooler RAW datatype. No browser print preview is involved. The printer must support ESC/POS RAW jobs and have a Windows driver/queue installed. Test the printer and paper cut behaviour before using it for live service.

## Order safety

- Online orders are read from the existing `orders` table and updated only through existing validated status RPCs.
- Counter orders use the `place_counter_order` RPC, which checks Store/Admin role and delegates price, add-on, offer, and idempotency validation to the existing `place_order` database function.
- Print attempts are recorded in `store_print_jobs`; print failures do not recreate or modify orders.

## First-release scope

- Counter sales use the existing server-validated menu, add-on, delivery-fee, COD/prepaid, and order-idempotency rules.
- Counter coupon/BOGO redemption is intentionally not enabled yet. The existing website redemption model is tied to authenticated customer accounts; the POS needs phone/guest-based redemption tracking before staff can safely apply those offers without consuming a redemption against the staff account. Website coupons and BOGO remain unchanged.
- This application requires an internet connection for authentication and order creation/updates. Offline order creation is intentionally not enabled in the first release.
