import { Heart, Leaf, Flame, Plus, Sparkles } from "lucide-react";
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

export function MenuItemCard({ item, saved, onToggleSave }: { item: MenuItem; saved?: boolean; onToggleSave?: (item: MenuItem) => void }) {
  const { add } = useCart();

  return (
    <article className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-float">
      <div className="relative h-24 overflow-hidden bg-ember p-5 text-primary-foreground">
        <div className="absolute -right-8 -top-10 size-32 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.16em] backdrop-blur">
            <Sparkles className="size-3" /> Aussie favourite
          </span>
          {onToggleSave && (
            <button type="button" aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => onToggleSave(item)} className="grid size-9 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:scale-105 hover:bg-white/25">
              <Heart className={`size-4 ${saved ? "fill-current" : ""}`} />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-[1.05]">{item.name}</h3>
          <span className="shrink-0 text-lg font-black text-primary">{currency(item.price)}</span>
        </div>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{item.description || "Properly cooked, generously served and made to order."}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {item.is_vegetarian && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5"><Leaf className="size-3" /> Veg</span>}
          {item.is_spicy && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5"><Flame className="size-3" /> Spicy</span>}
          {item.calories && <span className="rounded-full bg-secondary px-2.5 py-1.5">{item.calories} cal</span>}
        </div>
        <Button size="sm" className="mt-5 h-11 w-full rounded-xl font-extrabold shadow-sm transition group-hover:shadow-md" disabled={!item.is_available} onClick={() => { add({ id: item.id, name: item.name, price: item.price }); toast.success(`${item.name} added to your bag`); }}>
          <Plus className="size-4" /> {item.is_available ? "Add to order" : "Sold out"}
        </Button>
      </div>
    </article>
  );
}
