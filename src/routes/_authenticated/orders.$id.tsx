import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { currency, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CANCELLABLE = ["pending", "accepted", "call_requested"];

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details — Australian Bite" },
      { name: "description", content: "Live status, items and timeline for your Australian Bite order, with the option to cancel." },
      { property: "og:title", content: "Order details — Australian Bite" },
      { property: "og:description", content: "Live status, items and timeline for your order." },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    refetchInterval: 10000,
    queryFn: async () => {
      const [order, items, events] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id),
        supabase.from("order_events").select("*").eq("order_id", id).order("created_at"),
      ]);
      if (order.error) throw order.error;
      return { order: order.data, items: items.data ?? [], events: events.data ?? [] };
    },
  });

  const cancel = async () => {
    if (!data?.order || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled", cancel_reason: reason || null })
        .eq("id", id);
      if (error) throw error;
      await supabase.from("order_events").insert({
        order_id: id,
        status: "cancelled",
        note: reason || "Cancelled by customer",
        created_by: user.id,
      });
      toast.success("Order cancelled");
      void qc.invalidateQueries({ queryKey: ["order", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <main className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Loading order…</main>;
  if (!data?.order)
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/orders" className="mt-4 inline-block">
          <Button>Back to orders</Button>
        </Link>
      </main>
    );

  const order = data.order;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/orders" className="text-sm font-bold uppercase tracking-wide text-primary">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-display text-4xl">{order.order_number}</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Placed {formatDateTime(order.created_at)} · {order.order_type}
        {order.scheduled_for ? ` · scheduled for ${formatDateTime(order.scheduled_for)}` : ""}
      </p>

      {order.decline_reason && (
        <p className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
          Declined: {order.decline_reason}
        </p>
      )}

      <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-bold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.quantity} × {item.item_name}
              </span>
              <span>{currency(Number(item.unit_price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{currency(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>{currency(Number(order.delivery_fee))}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{currency(Number(order.total))}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-bold">Timeline</h2>
        <ol className="mt-3 space-y-3">
          {data.events.map((event) => (
            <li key={event.id} className="border-l-2 border-primary pl-4 text-sm">
              <p className="font-semibold">{ORDER_STATUS_LABELS[event.status] ?? event.status}</p>
              {event.note && <p className="text-muted-foreground">{event.note}</p>}
              <p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</p>
            </li>
          ))}
        </ol>
      </section>

      {CANCELLABLE.includes(order.status) && (
        <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-bold">Need to cancel?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You can cancel while we haven't started cooking. Tell us why (optional).
          </p>
          <Textarea
            className="mt-3"
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Changed my mind…"
          />
          <Button variant="destructive" className="mt-3" disabled={busy} onClick={cancel}>
            {busy ? "Cancelling…" : "Cancel order"}
          </Button>
        </section>
      )}
    </main>
  );
}
