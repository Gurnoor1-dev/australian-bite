import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { currency } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — Australian Bite" },
      { name: "description", content: "Review your Australian Bite order before checkout, adjust quantities and head to payment." },
      { property: "og:title", content: "Your bag — Australian Bite" },
      { property: "og:description", content: "Review your order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQuantity, remove, subtotal } = useCart();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-display text-4xl">Your bag</h1>
      {lines.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-muted-foreground">Your bag is empty.</p>
          <Link to="/menu" className="mt-4 inline-block">
            <Button>Browse the menu</Button>
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-3">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex-1">
                  <p className="font-bold">{line.name}</p>
                  <p className="text-sm text-muted-foreground">{currency(line.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" aria-label="Decrease" onClick={() => setQuantity(line.id, line.quantity - 1)}>
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{line.quantity}</span>
                  <Button size="icon" variant="outline" aria-label="Increase" onClick={() => setQuantity(line.id, line.quantity + 1)}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                <span className="w-20 text-right font-bold">{currency(line.price * line.quantity)}</span>
                <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(line.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-card">
            <span className="text-lg font-bold">Subtotal</span>
            <span className="text-2xl font-bold">{currency(subtotal)}</span>
          </div>
          <Link to="/checkout" className="mt-5 block">
            <Button size="lg" className="w-full">Checkout</Button>
          </Link>
        </>
      )}
    </main>
  );
}
