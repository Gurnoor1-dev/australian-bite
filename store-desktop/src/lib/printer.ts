import { invoke } from "@tauri-apps/api/core";

export type ReceiptLine = {
  name: string;
  variant?: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  addons?: string[];
};

export type ReceiptPayload = {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address?: string | null;
  fulfillment_type: string;
  payment_method: string;
  payment_status: string;
  items: ReceiptLine[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  notes?: string | null;
};

export type PrintMode = "windows" | "thermal";

export async function listPrinters(): Promise<{ name: string }[]> {
  return invoke("list_printers");
}

/** RAW ESC/POS is only for compatible physical thermal printers. */
export async function printReceipt(printerName: string, receipt: ReceiptPayload): Promise<number> {
  return invoke("print_receipt", { printerName, receipt });
}

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

/**
 * Uses the Windows/WebView print pipeline (GDI/XPS), not RAW ESC/POS.
 * This is compatible with Microsoft Print to PDF and ordinary Windows printers.
 */
export function printReceiptDialog(receipt: ReceiptPayload): Promise<void> {
  const printWindow = window.open("", "_blank", "width=520,height=760");
  if (!printWindow) return Promise.reject(new Error("Windows blocked the receipt window. Allow pop-ups for Australian Bite POS and try again."));

  const rows = receipt.items.map((item) => `
    <div class="item">
      <div class="item-title">${escapeHtml(item.quantity)} × ${escapeHtml(item.name)} ${item.variant && item.variant !== "Standard" ? `<small>(${escapeHtml(item.variant)})</small>` : ""}</div>
      <div class="item-price"><span>${money(item.unit_price)} each</span><b>${money(item.line_total)}</b></div>
      ${(item.addons || []).map((addon) => `<div class="addon">+ ${escapeHtml(addon)}</div>`).join("")}
    </div>`).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.order_number)}</title>
  <style>
    @page { size: auto; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #20251e; font: 12px/1.45 Arial, sans-serif; }
    .receipt { width: 100%; max-width: 76mm; margin: 0 auto; }
    .brand { display:flex; align-items:center; justify-content:center; gap:9px; margin:0 0 5px; }
    .mark { width:34px;height:34px;border-radius:11px;background:#203b2b;color:#f5f0e4;display:grid;place-items:center;font:bold 15px Arial; }
    h1 { margin:0; font-size:17px; letter-spacing:.06em; }
    .sub { font-size:9px; letter-spacing:.18em; color:#6b7467; }
    .center { text-align:center; }
    .muted { color:#666; font-size:10px; }
    .rule { border:0; border-top:1px dashed #888; margin:10px 0; }
    .meta { display:grid; grid-template-columns:1fr; gap:2px; font-size:10px; }
    .item { padding:6px 0; border-bottom:1px dotted #bbb; }
    .item-title { font-weight:700; }
    .item-title small { font-weight:400; }
    .item-price,.total-row { display:flex; justify-content:space-between; gap:8px; }
    .item-price { font-size:10px; margin-top:2px; }
    .addon { color:#555; font-size:10px; padding-left:12px; }
    .total-row { font-size:11px; padding:2px 0; }
    .grand { font-size:16px; font-weight:800; border-top:1px solid #222; margin-top:5px; padding-top:7px; }
    .footer { text-align:center; font-size:9px; color:#555; margin-top:14px; }
    @media screen { body { background:#eee; padding:18px; } .receipt { background:white; padding:18px; box-shadow:0 4px 24px #0002; } }
  </style></head><body><main class="receipt">
    <header class="center"><div class="brand"><span class="mark">AB</span><div style="text-align:left"><h1>AUSTRALIAN BITE</h1><div class="sub">FRESH · FAST · LOCAL</div></div></div>
    <div class="muted">Near NH-152, Kurukshetra Road, Pehowa, Haryana 136128</div><div class="muted">+91 74043 39777</div></header>
    <hr class="rule"><div class="meta"><b>ORDER ${escapeHtml(receipt.order_number)}</b><span>${escapeHtml(receipt.created_at)}</span>
    <span>Customer: ${escapeHtml(receipt.customer_name)}</span><span>Phone: ${escapeHtml(receipt.customer_phone)}</span>
    ${receipt.address ? `<span>Address: ${escapeHtml(receipt.address)}</span>` : ""}
    <span>Type: ${escapeHtml(receipt.fulfillment_type)}</span><span>Payment: ${escapeHtml(receipt.payment_method)} · ${escapeHtml(receipt.payment_status)}</span></div>
    <hr class="rule">${rows}<hr class="rule">
    <div class="total-row"><span>Subtotal</span><b>${money(receipt.subtotal)}</b></div>
    ${receipt.discount > 0 ? `<div class="total-row"><span>Discount</span><b>−${money(receipt.discount)}</b></div>` : ""}
    ${receipt.delivery_fee > 0 ? `<div class="total-row"><span>Delivery</span><b>${money(receipt.delivery_fee)}</b></div>` : ""}
    <div class="total-row grand"><span>TOTAL</span><b>${money(receipt.total)}</b></div>
    ${receipt.notes ? `<p class="muted">Notes: ${escapeHtml(receipt.notes)}</p>` : ""}
    <div class="footer">Thank you for ordering!<br>Order receipt · Not a GST tax invoice</div>
  </main></body></html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return new Promise((resolve, reject) => {
    printWindow.addEventListener("afterprint", () => resolve(), { once: true });
    printWindow.addEventListener("beforeunload", () => resolve(), { once: true });
    window.setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch (error) { reject(error); } }, 350);
    window.setTimeout(() => {
      if (!printWindow.closed) reject(new Error("The print dialog did not finish. Check the Windows print window."));
    }, 120000);
  });
}
