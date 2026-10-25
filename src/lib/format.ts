export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting confirmation",
  accepted: "Accepted",
  preparing: "In the kitchen",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
  call_requested: "Restaurant will call you",
};

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI (GPay / PhonePe / Paytm)" },
  { value: "card", label: "Credit / Debit card" },
  { value: "netbanking", label: "Net banking" },
  { value: "cod", label: "Cash on delivery" },
] as const;

export const PAYMENT_LABELS: Record<string, string> = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));
export const DELIVERY_FEE = 49;
export const UPI_ID = "aubite@upi";
export const SUPPORT_PHONE = "+91 74043 39777";
export const SUPPORT_PHONE_TEL = "+917404339777";
export const STORE_ADDRESS = "Near NH-152, Kurukshetra Road, Pehowa, Haryana, India 136128";
export const STORE_HOURS = "10:00 AM to 11:00 PM";
export const FESTIVAL_PRICING_NOTE = "Prices may vary during festivals.";

export function statusTone(status: string) {
  if (status === "declined" || status === "cancelled") return "destructive";
  if (status === "completed") return "success";
  if (status === "pending" || status === "call_requested") return "warning";
  return "accent";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export type Offer = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order: number;
  max_discount: number | null;
  valid_until: string | null;
  is_active: boolean;
};

export function offerDiscount(offer: Offer, subtotal: number) {
  if (subtotal < Number(offer.min_order)) return 0;
  const raw = offer.discount_type === "flat" ? Number(offer.discount_value) : (subtotal * Number(offer.discount_value)) / 100;
  const capped = offer.max_discount ? Math.min(raw, Number(offer.max_discount)) : raw;
  return Math.min(Math.round(capped), subtotal);
}
