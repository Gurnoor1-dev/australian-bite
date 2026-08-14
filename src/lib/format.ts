export const currency = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);

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

export const SUPPORT_PHONE = "+61 2 8123 4400";
export const SUPPORT_PHONE_TEL = "+61281234400";

export function statusTone(status: string) {
  if (status === "declined" || status === "cancelled") return "destructive";
  if (status === "completed") return "success";
  if (status === "pending" || status === "call_requested") return "warning";
  return "accent";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}