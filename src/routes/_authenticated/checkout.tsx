import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DELIVERY_FEE = 6.9;

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Australian Bite" },
      { name: "description", content: "Confirm your Australian Bite order: choose pickup or delivery, schedule a time and place your order." },
      { property: "og:title", content: "Checkout — Australian Bite" },
      { property: "og:description", content: "Choose pickup or delivery and schedule your order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (lines.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    setBusy(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_type: orderType,
          contact_name: name || null,
          contact_phone: phone,
          address: orderType === "delivery" ? address : null,
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
          notes: notes || null,
          subtotal,
          delivery_fee: deliveryFee,
          total,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          menu_item_id: l.id,
          item_name: l.name,
          unit_price: l.price,
          quantity: l.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      await supabase.from("order_events").insert({
        order_id: order.id,
        status: "pending",
        note: "Order placed by customer",
        created_by: user.id,
      });

      clear();
      toast.success(`Order ${order.order_number} placed!`);
      navigate({ to: "/orders/$id", params: { id: order.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place the order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-display text-4xl">Checkout</h1>
      <form className="mt-8 space-y-5" onSubmit={placeOrder}>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">How do you want it?</p>
          <div className="mt-3 flex gap-2">
            {(["pickup", "delivery"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-bold capitalize transition-colors ${
                  orderType === t ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-card sm:grid-cols-2">
          <div>
            <Label htmlFor="cname">Name</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          </div>
          <div>
            <Label htmlFor="cphone">Mobile</Label>
            <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
          </div>
          {orderType === "delivery" && (
            <div className="sm:col-span-2">
              <Label htmlFor="caddr">Delivery address</Label>
              <Input id="caddr" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} required />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="csched">Schedule for later (optional)</Label>
            <Input id="csched" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cnotes">Notes for the kitchen</Label>
            <Textarea id="cnotes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <Row label="Subtotal" value={currency(subtotal)} />
          <Row label="Delivery" value={currency(deliveryFee)} />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={busy || lines.length === 0}>
          {busy ? "Placing your order…" : `Place order · ${currency(total)}`}
        </Button>
      </form>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
