import { Heart, Leaf, Flame, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";
import { useCart } from "@/lib/cart";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  is_vegetarian: boolean;
  is_spicy: boolean;
  calories: number | null;
  category_id: string;
};

export function MenuItemCard({
  item,
  saved,
  onToggleSave,
}: {
  item: MenuItem;
  saved?: boolean;
  onToggleSave?: (item: MenuItem) => void;
}) {
  const { add } = useCart();

  return (
    <article className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg leading-tight">{item.name}</h3>
        {onToggleSave && (
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={() => onToggleSave(item)}
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <Heart className={`size-4 ${saved ? "fill-primary text-primary" : ""}`} />
          </button>
        )}
      </div>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {item.is_vegetarian && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
            <Leaf className="size-3" /> Veg
          </span>
        )}
        {item.is_spicy && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
            <Flame className="size-3" /> Spicy
          </span>
        )}
        {item.calories && <span className="rounded-full bg-secondary px-2 py-1">{item.calories} cal</span>}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xl font-bold">{currency(item.price)}</span>
        <Button
          size="sm"
          className="gap-1"
          disabled={!item.is_available}
          onClick={() => {
            add({ id: item.id, name: item.name, price: item.price });
            toast.success(`${item.name} added to your bag`);
          }}
        >
          <Plus className="size-4" /> {item.is_available ? "Add" : "Sold out"}
        </Button>
      </div>
    </article>
  );
}