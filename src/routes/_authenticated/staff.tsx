import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { currency, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff console — Australian Bite" },
      { name: "description", content: "Kitchen console for Australian Bite staff: accept, call back or decline incoming orders and answer support chats." },
      { property: "og:title", content: "Staff console — Australian Bite" },
      { property: "og:description", content: "Accept, call or decline incoming orders in real time." },
    ],
  }),
  component: StaffPage,
});

const FLOW: Record<string, { next: string; label: string }[]> = {
  pending: [
    { next: "accepted", label: "Accept" },
    { next: "call_requested", label: "Call customer" },
  ],
  call_requested: [{ next: "accepted", label: "Accept" }],
  accepted: [{ next: "preparing", label: "Start cooking" }],
  preparing: [
    { next: "ready", label: "Ready for pickup" },
    { next: "out_for_delivery", label: "Out for delivery" },
  ],
  ready: [{ next: "completed", label: "Complete" }],
  out_for_delivery: [{ next: "completed", label: "Complete" }],
};

function StaffPage() {
  const { user, isStaff, loading } = useAuth();
  const qc = useQueryClient();
  const [declineReason, setDeclineReason] = useState<Record<string, string>>({});

  const { data: orders } = useQuery({
    queryKey: ["staff-orders"],
    enabled: isStaff,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (orderId: string, status: string, note?: string) => {
    const patch: { status: string; decline_reason?: string | null } = { status };
    if (status === "declined") patch.decline_reason = note || null;
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("order_events").insert({
      order_id: orderId,
      status,
      note: note || null,
      created_by: user?.id ?? null,
    });
    toast.success(`Order marked ${ORDER_STATUS_LABELS[status] ?? status}`);
    void qc.invalidateQueries({ queryKey: ["staff-orders"] });
  };

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-12 text-muted-foreground">Checking access…</main>;
  if (!isStaff)
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-display text-3xl">Staff only</h1>
        <p className="mt-2 text-muted-foreground">This console is limited to Australian Bite crew accounts.</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-display text-4xl">Kitchen console</h1>
      <p className="mt-2 text-muted-foreground">Live order queue — accept, call back or decline.</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {(orders ?? []).map((order) => {
          const items = (order as unknown as { order_items: { id: string; item_name: string; quantity: number }[] })
            .order_items;
          return (
            <article key={order.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{order.order_number}</h2>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
                <span className="ml-auto font-bold">{currency(Number(order.total))}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.order_type} · {order.contact_name ?? "Customer"} ·{" "}
                <a className="text-primary" href={`tel:${order.contact_phone}`}>
                  {order.contact_phone}
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Placed {formatDateTime(order.created_at)}
                {order.scheduled_for ? ` · for ${formatDateTime(order.scheduled_for)}` : ""}
              </p>
              {order.address && <p className="mt-1 text-sm">{order.address}</p>}
              {order.notes && <p className="mt-1 text-sm italic text-muted-foreground">“{order.notes}”</p>}

              <ul className="mt-3 space-y-1 text-sm">
                {(items ?? []).map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.item_name}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {(FLOW[order.status] ?? []).map((action) => (
                  <Button key={action.next} size="sm" onClick={() => void setStatus(order.id, action.next)}>
                    {action.label}
                  </Button>
                ))}
              </div>

              {["pending", "call_requested", "accepted"].includes(order.status) && (
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Decline reason (optional)"
                    value={declineReason[order.id] ?? ""}
                    maxLength={200}
                    onChange={(e) => setDeclineReason((p) => ({ ...p, [order.id]: e.target.value }))}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void setStatus(order.id, "declined", declineReason[order.id])}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <StaffSupport />
    </main>
  );
}

function StaffSupport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const { data: threads } = useQuery({
    queryKey: ["staff-threads"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_threads")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["staff-thread-messages", activeThread],
    enabled: !!activeThread,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("thread_id", activeThread!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !user || !body.trim()) return;
    const text = body.trim();
    setBody("");
    const { error } = await supabase
      .from("support_messages")
      .insert({ thread_id: activeThread, sender_id: user.id, is_staff: true, body: text });
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["staff-thread-messages", activeThread] });
  };

  return (
    <section className="mt-12">
      <h2 className="text-display text-3xl">Support inbox</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <ul className="space-y-2">
          {(threads ?? []).map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => setActiveThread(thread.id)}
                className={`w-full rounded-2xl border p-3 text-left text-sm ${
                  activeThread === thread.id ? "border-primary" : "border-border"
                }`}
              >
                <p className="font-bold">{thread.subject}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(thread.updated_at)}</p>
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
          {!activeThread ? (
            <p className="text-sm text-muted-foreground">Pick a conversation to reply.</p>
          ) : (
            <>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {(messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.is_staff ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-[11px] opacity-70">{formatDateTime(m.created_at)}</p>
                  </div>
                ))}
              </div>
              <form className="mt-3 flex gap-2" onSubmit={reply}>
                <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply to customer…" maxLength={800} />
                <Button type="submit">Send</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
