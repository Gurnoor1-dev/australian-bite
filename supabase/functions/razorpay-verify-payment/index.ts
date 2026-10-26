import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!url || !anonKey || !serviceKey || !razorpayKey || !razorpaySecret) return reply(503, { error: "Online payments are not configured yet." });

  const authorization = req.headers.get("Authorization");
  if (!authorization) return reply(401, { error: "Sign in to continue." });
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return reply(401, { error: "Your session has expired. Sign in again." });

  let body: { orderId?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request body." }); }
  if (!body.orderId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) return reply(400, { error: "Payment verification fields are required." });

  const { data: order, error: orderError } = await userClient.from("orders")
    .select("id,order_number,total,payment_method,payment_status,razorpay_order_id")
    .eq("id", body.orderId).eq("customer_id", user.id).maybeSingle();
  if (orderError || !order) return reply(404, { error: "Order not found." });
  if (order.payment_status === "paid") return reply(200, { verified: true, alreadyVerified: true, orderNumber: order.order_number });
  if (order.payment_method !== "prepaid" || !order.razorpay_order_id || order.razorpay_order_id !== body.razorpay_order_id) {
    return reply(400, { error: "The payment does not match this order." });
  }

  const expected = await hmacHex(razorpaySecret, body.razorpay_order_id + "|" + body.razorpay_payment_id);
  if (!constantTimeEqual(expected, body.razorpay_signature)) return reply(400, { error: "Payment signature could not be verified." });

  const paymentResponse = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(body.razorpay_payment_id), {
    headers: { "Authorization": "Basic " + btoa(razorpayKey + ":" + razorpaySecret) },
  });
  const payment = await paymentResponse.json().catch(() => ({}));
  if (!paymentResponse.ok || payment.order_id !== body.razorpay_order_id || payment.status !== "captured" ||
      Number(payment.amount) !== Number(order.total) * 100 || payment.currency !== "INR") {
    return reply(400, { error: "Payment is not captured for the exact order amount." });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: updated, error: updateError } = await admin.from("orders")
    .update({ payment_status: "paid", payment_provider: "razorpay", razorpay_payment_id: body.razorpay_payment_id, razorpay_signature: body.razorpay_signature, updated_at: new Date().toISOString() })
    .eq("id", order.id).eq("customer_id", user.id).eq("payment_status", "pending").select("id").maybeSingle();
  if (updateError) {
    console.error("Could not mark verified Razorpay payment paid", updateError.message);
    return reply(500, { error: "Payment verified but the order could not be updated. Contact the store." });
  }
  if (!updated) {
    const { data: latest } = await admin.from("orders").select("payment_status").eq("id", order.id).maybeSingle();
    if (latest?.payment_status !== "paid") return reply(409, { error: "The order payment state changed. Contact the store." });
  }
  await admin.from("order_events").insert({ order_id: order.id, status: "payment_verified", note: "Razorpay payment verified server-side", created_by: user.id });
  return reply(200, { verified: true, orderNumber: order.order_number });
});
