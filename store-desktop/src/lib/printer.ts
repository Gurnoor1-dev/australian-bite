import { invoke } from "@tauri-apps/api/core";
import logoUrl from "../assets/australian-bite-logo.png";

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

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] as string));
const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

function printPdfOrOfficeReceipt(receipt: ReceiptPayload): Promise<number> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.title = "Australian Bite receipt";
    Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "1px", height: "1px", border: "0", opacity: "0", pointerEvents: "none" });
    const itemRows = receipt.items.map((item) => [
      '<div class="item"><div class="item-name">', escapeHtml(item.name),
      item.variant && item.variant !== "Standard" ? ' <small>(' + escapeHtml(item.variant) + ')</small>' : "",
      '</div><div class="item-meta"><span>', String(item.quantity), ' × ', rupees(item.unit_price),
      '</span><b>', rupees(item.line_total), '</b></div>',
      (item.addons || []).map((addon) => '<div class="addon">+ ' + escapeHtml(addon) + '</div>').join(""),
      '</div>'
    ].join("")).join("");
    const row = (label: string, value: string, extra = "") => '<div class="total-row ' + extra + '"><span>' + label + '</span><b>' + value + '</b></div>';
    const html = [
      '<!doctype html><html><head><meta charset="utf-8"><title>Receipt ', escapeHtml(receipt.order_number), '</title><style>',
      '@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#20251e;font:12px Arial,sans-serif}.receipt{width:76mm;max-width:100%;margin:0 auto;padding:5mm 2mm}.brand{text-align:center;border-bottom:1px dashed #777;padding-bottom:12px}.brand img{display:block;width:46mm;max-height:24mm;object-fit:contain;margin:0 auto 7px}.brand h1{font-size:18px;letter-spacing:1px;margin:0 0 5px}.brand p{font-size:10px;line-height:1.5;margin:2px}.rule{border:0;border-top:1px dashed #777;margin:11px 0}.meta{font-size:11px;line-height:1.55}.meta b{font-size:12px}.item{padding:7px 0;border-bottom:1px dotted #aaa}.item-name{font-weight:700;line-height:1.4}.item-name small{font-weight:400}.item-meta{display:flex;justify-content:space-between;gap:8px;margin-top:4px}.addon{font-size:10px;color:#555;margin-top:3px}.total-row{display:flex;justify-content:space-between;gap:10px;margin:6px 0}.total-row.grand{font-size:15px;font-weight:700;border-top:1px solid #333;padding-top:9px;margin-top:10px}.footer{text-align:center;font-size:10px;line-height:1.5;margin-top:18px}.notes{margin-top:10px;font-size:10px;overflow-wrap:anywhere}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}',
      '</style></head><body><article class="receipt"><header class="brand"><img src="', logoUrl, '" alt="Australian Bite"><h1>AUSTRALIAN BITE</h1><p>Near NH-152, Kurukshetra Road<br>Pehowa, Haryana 136128<br>+91 74043 39777</p></header><hr class="rule">',
      '<section class="meta"><b>ORDER ', escapeHtml(receipt.order_number), '</b><br>', escapeHtml(receipt.created_at),
      '<br>Customer: ', escapeHtml(receipt.customer_name), '<br>Phone: ', escapeHtml(receipt.customer_phone),
      receipt.address ? '<br>Address: ' + escapeHtml(receipt.address) : "",
      '<br>Type: ', escapeHtml(receipt.fulfillment_type), '<br>Payment: ', escapeHtml(receipt.payment_method),
      ' (', escapeHtml(receipt.payment_status), ')</section><hr class="rule">', itemRows, '<hr class="rule">',
      row("Subtotal", rupees(receipt.subtotal)),
      receipt.discount > 0 ? row("Discount", "− " + rupees(receipt.discount)) : "",
      receipt.delivery_fee > 0 ? row("Delivery", rupees(receipt.delivery_fee)) : "",
      row("TOTAL", rupees(receipt.total), "grand"),
      receipt.notes ? '<p class="notes">Notes: ' + escapeHtml(receipt.notes) + '</p>' : "",
      '<footer class="footer">Thank you for ordering!<br>Order receipt — not a GST tax invoice</footer></article></body></html>'
    ].join("");
    let finished = false;
    const finish = () => { if (finished) return; finished = true; frame.remove(); resolve(0); };
    frame.onload = () => {
      const win = frame.contentWindow;
      if (!win) { frame.remove(); reject(new Error("Could not open the receipt print preview.")); return; }
      win.addEventListener("afterprint", finish, { once: true });
      win.focus();
      win.print();
      window.setTimeout(finish, 120000);
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}

export async function printReceipt(printerName: string, receipt: ReceiptPayload): Promise<number> {
  if (/print to pdf|microsoft.*pdf|pdf/i.test(printerName)) return printPdfOrOfficeReceipt(receipt);
  return invoke("print_receipt", { printerName, receipt });
}
