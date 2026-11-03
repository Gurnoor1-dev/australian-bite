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

export function isVirtualPrinter(name: string): boolean {
  return /microsoft print to pdf|adobe pdf|onenote|microsoft xps|fax/i.test(name);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

function printVirtualReceipt(receipt: ReceiptPayload): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Australian Bite receipt print preview");
  iframe.style.position = "fixed";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  const itemRows = receipt.items.map((item) => `
    <div class="item">
      <div class="item-name">${escapeHtml(item.name)}${item.variant && item.variant !== "Standard" ? ` · ${escapeHtml(item.variant)}` : ""}</div>
      <div class="line"><span>${item.quantity} × ₹${item.unit_price}</span><b>₹${item.line_total}</b></div>
      ${(item.addons || []).map((addon) => `<div class="addon">+ ${escapeHtml(addon)}</div>`).join("")}
    </div>`).join("");
  iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.order_number)}</title>
    <style>
      @page{size:80mm auto;margin:4mm}
      *{box-sizing:border-box}body{font:12px/1.45 Arial,sans-serif;color:#111;width:72mm;margin:0 auto}
      .center{text-align:center}.brand{font-size:21px;font-weight:800;letter-spacing:.5px;margin:0 0 3px}
      .muted{color:#555;font-size:10px}.rule{border:0;border-top:1px dashed #555;margin:9px 0}
      .line{display:flex;justify-content:space-between;gap:8px}.meta{margin:2px 0;overflow-wrap:anywhere}
      .item{margin:8px 0}.item-name{font-weight:700}.addon{font-size:10px;padding-left:8px}
      .total{font-size:16px;font-weight:800}.footer{margin-top:12px}
    </style></head><body>
    <header class="center"><p class="brand">AUSTRALIAN BITE</p>
      <div class="muted">Near NH-152, Kurukshetra Road<br>Pehowa, Haryana 136128<br>+91 74043 39777</div>
    </header><hr class="rule">
    <div class="meta"><b>ORDER:</b> ${escapeHtml(receipt.order_number)}</div>
    <div class="meta">${escapeHtml(receipt.created_at)}</div>
    <div class="meta"><b>Customer:</b> ${escapeHtml(receipt.customer_name)}</div>
    <div class="meta"><b>Phone:</b> ${escapeHtml(receipt.customer_phone)}</div>
    ${receipt.address ? `<div class="meta"><b>Address:</b> ${escapeHtml(receipt.address)}</div>` : ""}
    <div class="meta"><b>Type:</b> ${escapeHtml(receipt.fulfillment_type)}</div>
    <div class="meta"><b>Payment:</b> ${escapeHtml(receipt.payment_method)} · ${escapeHtml(receipt.payment_status)}</div>
    <hr class="rule">${itemRows}<hr class="rule">
    <div class="line"><span>Subtotal</span><b>₹${receipt.subtotal}</b></div>
    ${receipt.discount > 0 ? `<div class="line"><span>Discount</span><b>- ₹${receipt.discount}</b></div>` : ""}
    ${receipt.delivery_fee > 0 ? `<div class="line"><span>Delivery</span><b>₹${receipt.delivery_fee}</b></div>` : ""}
    <hr class="rule"><div class="line total"><span>TOTAL</span><span>₹${receipt.total}</span></div>
    ${receipt.notes ? `<p><b>Notes:</b> ${escapeHtml(receipt.notes)}</p>` : ""}
    <footer class="center footer"><b>Thank you for ordering!</b><p class="muted">Order receipt · Not a GST tax invoice</p></footer>
    </body></html>`;
  document.body.appendChild(iframe);
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.setTimeout(() => iframe.remove(), 500);
      resolve();
    };
    iframe.onload = () => {
      try {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) throw new Error("Windows print preview could not be opened.");
        frameWindow.onafterprint = finish;
        frameWindow.focus();
        frameWindow.print();
        // Chromium normally returns after the Windows dialog closes; afterprint is the fallback.
        window.setTimeout(finish, 1000);
      } catch (error) {
        iframe.remove();
        reject(error instanceof Error ? error : new Error("Could not open the Windows print dialog."));
      }
    };
    iframe.onerror = () => {
      iframe.remove();
      reject(new Error("Could not prepare the PDF receipt."));
    };
  });
}

export async function listPrinters(): Promise<{ name: string }[]> {
  return invoke("list_printers");
}

export async function printReceipt(printerName: string, receipt: ReceiptPayload): Promise<number> {
  if (isVirtualPrinter(printerName)) {
    await printVirtualReceipt(receipt);
    return 0;
  }
  return invoke("print_receipt", { printerName, receipt });
}
