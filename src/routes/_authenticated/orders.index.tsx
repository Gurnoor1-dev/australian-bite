import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { currency, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/orders/")({
  head: () => ({
    meta: [
      { title: "My orders — Australian Bite" },
      { name: "description", content: "Track current Australian Bite orders and revisit your order history with full status updates." },
      { property: "og:title", content: "My orders — Australian Bite" },
      { property: "og:description", content: "Track current orders and revisit your history." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-display text-4xl">My orders</h1>
      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading your orders…</p>
      ) : (data ?? []).length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-muted-foreground">No orders yet.</p>
          <Link to="/menu" className="mt-4 inline-block">
            <Button>Start an order</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {(data ?? []).map((order) => (
            <li key={order.id}>
              <Link
                to="/orders/$id"
                params={{ id: order.id }}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary"
              >
                <div className="flex-1">
                  <p className="font-bold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(order.created_at)} · {order.order_type}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wide">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
                <span className="font-bold">{currency(Number(order.total))}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
