# Razorpay payment setup (Australian Bite)

The order flow is already prepared to create orders server-side and validate totals from the database. Razorpay credentials must never be placed in client-side source or committed to Git.

## Configure secrets

In the Supabase project **AustralianBite**, set these Edge Function secrets using the Supabase CLI or dashboard secrets manager:

- `RAZORPAY_KEY_ID` — test key first, then live key after verification
- `RAZORPAY_KEY_SECRET` — secret for the same Razorpay account/key pair
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key (never a VITE_ variable)

Supabase supplies `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Edge Functions. Deploy both functions after adding secrets:

```sh
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
```

## Endpoint contract

- `razorpay-create-order`: authenticated customer submits `{ "orderId": "<Australian Bite order UUID>" }`. The function checks ownership, requires the order's payment method to be `prepaid`, creates the Razorpay order for the database-calculated total, and stores the gateway order ID.
- `razorpay-verify-payment`: authenticated customer submits `orderId`, `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. The function verifies the HMAC signature and independently fetches the payment from Razorpay; only a captured payment for the exact INR amount is marked paid.

The storefront intentionally keeps the current one-step prepaid order placement until credentials and the hosted checkout UI are configured. Do not treat a `pending` prepaid order as paid or ask a delivery partner to collect cash for it. Test with Razorpay test keys and test cards before switching to live keys.
