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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!url || !anonKey || !serviceKey || !razorpayKey || !razorpaySecret) {
    return reply(503, { error: "Online payments are not configured yet." });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return reply(401, { error: "Sign in to continue." });
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return reply(401, { error: "Your session has expired. Sign in again." });

  let body: { orderId?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "Invalid request body." }); }
  if (!body.orderId || !/^[0-9a-f-]{36}$/i.test(body.orderId)) return reply(400, { error: "A valid order ID is required." });

  const { data: order, error: orderError } = await userClient.from("orders")
    .select("id,order_number,total,payment_method,payment_status,razorpay_order_id")
    .eq("id", body.orderId).eq("customer_id", user.id).maybeSingle();
  if (orderError || !order) return reply(404, { error: "Order not found." });
  if (order.payment_method !== "prepaid") return reply(400, { error: "This order is not marked for prepaid payment." });
  if (order.payment_status === "paid") return reply(409, { error: "This order is already paid." });
  if (order.payment_status === "failed") return reply(409, { error: "This payment attempt failed. Contact the store before retrying." });

  if (order.razorpay_order_id) {
    return reply(200, { keyId: razorpayKey, razorpayOrderId: order.razorpay_order_id, amount: Number(order.total) * 100, currency: "INR", orderNumber: order.order_number });
  }

  const gateway = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(razorpayKey + ":" + razorpaySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Number(order.total) * 100,
      currency: "INR",
      receipt: order.order_number,
      notes: { australian_bite_order_id: order.id, customer_id: user.id },
    }),
  });
  const gatewayBody = await gateway.json().catch(() => ({}));
  if (!gateway.ok || !gatewayBody.id) {
    console.error("Razorpay order creation failed", gateway.status);
    return reply(502, { error: "The payment gateway could not start checkout. Your order has not been marked paid." });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: saved, error: saveError } = await admin.from("orders")
    .update({ razorpay_order_id: gatewayBody.id, payment_provider: "razorpay" })
    .eq("id", order.id).eq("customer_id", user.id).is("razorpay_order_id", null)
    .select("razorpay_order_id").maybeSingle();
  if (saveError) {
    console.error("Could not persist Razorpay order reference", saveError.message);
    return reply(500, { error: "Could not prepare this payment. Contact the store before retrying." });
  }
  if (!saved?.razorpay_order_id) {
    const { data: latest } = await admin.from("orders").select("razorpay_order_id").eq("id", order.id).eq("customer_id", user.id).maybeSingle();
    if (!latest?.razorpay_order_id) return reply(409, { error: "The payment reference changed. Refresh checkout and retry." });
    return reply(200, { keyId: razorpayKey, razorpayOrderId: latest.razorpay_order_id, amount: Number(order.total) * 100, currency: "INR", orderNumber: order.order_number });
  }

  return reply(200, { keyId: razorpayKey, razorpayOrderId: saved.razorpay_order_id, amount: Number(order.total) * 100, currency: "INR", orderNumber: order.order_number });
});
