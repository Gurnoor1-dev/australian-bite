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

export async function listPrinters(): Promise<{ name: string }[]> {
  return invoke("list_printers");
}

export async function printReceipt(printerName: string, receipt: ReceiptPayload): Promise<number> {
  return invoke("print_receipt", { printerName, receipt });
}

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] as string));

export function isPdfPrinter(printerName: string): boolean {
  return /print\s*to\s*pdf|pdf/i.test(printerName);
}

/**
 * Windows virtual PDF printers are document printers, not ESC/POS devices.
 * Sending RAW receipt bytes to them produces a corrupt or empty PDF. Render a
 * real HTML receipt and let WebView2's native print pipeline create the PDF.
 */
export async function printReceiptPreview(receipt: ReceiptPayload, logoUrl = ""): Promise<void> {
  const lineRows = receipt.items.map((item) => {
    const variant = item.variant && item.variant !== "Standard" ? ` <small>(${escapeHtml(item.variant)})</small>` : "";
    const addons = (item.addons || []).map((addon) => `<div class="addon">+ ${escapeHtml(addon)}</div>`).join("");
    return `<div class="item"><div class="item-name">${escapeHtml(item.name)}${variant}</div><div class="item-total"><span>${item.quantity} × ${escapeHtml(money(item.unit_price))}</span><b>${escapeHtml(money(item.line_total))}</b></div>${addons}</div>`;
  }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.order_number)}</title>
  <style>
    @page{size:80mm auto;margin:4mm}
    *{box-sizing:border-box}body{margin:0;background:#fff;color:#171717;font:11px/1.45 Arial,sans-serif}
    .receipt{width:100%;max-width:72mm;margin:0 auto;padding:2mm 0}
    .logo{display:block;width:34mm;height:auto;max-height:22mm;object-fit:contain;margin:0 auto 3mm}
    h1{text-align:center;font-size:17px;letter-spacing:1px;margin:0 0 2mm}
    .center{text-align:center}.muted{color:#555}.rule{border:0;border-top:1px dashed #555;margin:3mm 0}
    .meta div{margin:1mm 0;overflow-wrap:anywhere}.item{margin:2mm 0}.item-name{font-weight:700}.item-name small{font-weight:400}
    .item-total{display:flex;justify-content:space-between;gap:3mm}.addon{padding-left:3mm;color:#444;font-size:10px}
    .totals div{display:flex;justify-content:space-between;margin:1mm 0}.totals .grand{font-weight:700;font-size:14px;margin-top:2mm}
    .thanks{text-align:center;margin-top:4mm;font-weight:700}.foot{text-align:center;font-size:9px;margin-top:1mm;color:#555}
    @media screen{body{background:#eee;padding:12px}.receipt{background:white;padding:8mm;box-shadow:0 2px 16px #0002}}
  </style></head><body><main class="receipt">
    <img class="logo" src="${escapeHtml(new URL("../../src/assets/australian-bite-logo.png", window.location.href).href)}" alt="Australian Bite">
    <h1>AUSTRALIAN BITE</h1><div class="center">Near NH-152, Kurukshetra Road<br>Pehowa, Haryana 136128<br>+91 74043 39777</div>
    <hr class="rule"><div class="meta">
      <div><b>ORDER:</b> ${escapeHtml(receipt.order_number)}</div><div>${escapeHtml(receipt.created_at)}</div>
      <div><b>Customer:</b> ${escapeHtml(receipt.customer_name)}</div><div><b>Phone:</b> ${escapeHtml(receipt.customer_phone)}</div>
      ${receipt.address ? `<div><b>Address:</b> ${escapeHtml(receipt.address)}</div>` : ""}
      <div><b>Type:</b> ${escapeHtml(receipt.fulfillment_type)}</div>
      <div><b>Payment:</b> ${escapeHtml(receipt.payment_method)} (${escapeHtml(receipt.payment_status)})</div>
    </div><hr class="rule">${lineRows}<hr class="rule">
    <div class="totals"><div><span>Subtotal</span><b>${escapeHtml(money(receipt.subtotal))}</b></div>
      ${receipt.discount > 0 ? `<div><span>Discount</span><b>− ${escapeHtml(money(receipt.discount))}</b></div>` : ""}
      ${receipt.delivery_fee > 0 ? `<div><span>Delivery</span><b>${escapeHtml(money(receipt.delivery_fee))}</b></div>` : ""}
      <div class="grand"><span>TOTAL</span><span>${escapeHtml(money(receipt.total))}</span></div>
    </div>${receipt.notes ? `<hr class="rule"><div><b>Notes:</b> ${escapeHtml(receipt.notes)}</div>` : ""}
    <div class="thanks">Thank you for ordering!</div><div class="foot">Order receipt — not a GST tax invoice</div>
  </main></body></html>`;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.border = "0";
  frame.srcdoc = html;
  document.body.appendChild(frame);
  await new Promise<void>((resolve, reject) => {
    frame.onload = () => {
      try {
        const win = frame.contentWindow;
        if (!win) throw new Error("Could not open the Windows print dialog.");
        win.focus();
        win.addEventListener("afterprint", () => { frame.remove(); resolve(); }, { once: true });
        win.print();
        // WebView2 can omit afterprint when the user cancels; avoid leaving a hidden frame.
        window.setTimeout(() => { if (frame.isConnected) frame.remove(); resolve(); }, 120000);
      } catch (error) { frame.remove(); reject(error); }
    };
    frame.onerror = () => { frame.remove(); reject(new Error("Could not prepare the receipt for PDF printing.")); };
  });
}

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
