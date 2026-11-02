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