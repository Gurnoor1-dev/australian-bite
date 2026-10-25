import { useState } from "react";
import { Heart, Flame, Plus, Sparkles, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/format";
import { useCart } from "@/lib/cart";

export type MenuVariant = {
  id: string;
  variant: string;
  price: number;
  is_available: boolean;
  item_type: "Veg" | "Non-Veg";
};

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
  variant?: string;
  item_type?: "Veg" | "Non-Veg";
  variantOptions?: MenuVariant[];
};

export function MenuItemCard({ item, saved, onToggleSave }: { item: MenuItem; saved?: boolean; onToggleSave?: (item: MenuItem) => void }) {
  const { add } = useCart();
  const options = item.variantOptions?.length ? item.variantOptions : [{ id: item.id, variant: item.variant || "Standard", price: item.price, is_available: item.is_available, item_type: item.item_type ?? (item.is_vegetarian ? "Veg" as const : "Non-Veg" as const) }];
  const [selectedId, setSelectedId] = useState(item.id);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];
  const hasSizeChoice = options.length > 1;
  const dietaryType = selected.item_type ?? item.item_type ?? (item.is_vegetarian ? "Veg" : "Non-Veg");
  const lineName = hasSizeChoice || selected.variant !== "Standard" ? `${item.name} — ${selected.variant}` : item.name;

  return (
    <article className="bite-product-card group relative flex min-h-[420px] flex-col overflow-hidden rounded-[26px] border border-border/80 bg-card shadow-card">
      <div className="bite-product-photo" aria-hidden="true">
        <div className="bite-product-photo-shade" />
        <span className="bite-product-brand"><Sparkles className="size-3" /> Made for good moods</span>
        {onToggleSave && <button type="button" aria-label={saved ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`} aria-pressed={!!saved} onClick={() => onToggleSave(item)} className="bite-product-save"><Heart className={`size-4 ${saved ? "fill-current" : ""}`} /></button>}
        <span className={`bite-product-diet ${dietaryType === "Veg" ? "is-veg" : "is-nonveg"}`}><span className="size-2 rounded-full border border-current" />{dietaryType}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-[1.05]">{item.name}</h3>
          <span className="shrink-0 text-lg font-black text-primary">{currency(selected.price)}</span>
        </div>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{item.description || "Freshly prepared and made to order."}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {item.is_spicy && <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1.5"><Flame className="size-3" /> Spicy</span>}
          {hasSizeChoice && <span className="rounded-full bg-secondary px-2.5 py-1.5">{options.length} sizes</span>}
          {item.calories != null && <span className="rounded-full bg-secondary px-2.5 py-1.5">{item.calories} kcal</span>}
        </div>
        {hasSizeChoice && <label className="relative mt-4 block"><span className="sr-only">Choose size for {item.name}</span><select value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-9 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">{options.map((option) => <option key={option.id} value={option.id}>{option.variant} · {currency(option.price)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>}
        <Button size="sm" className="bite-product-add mt-4 h-11 w-full rounded-xl font-extrabold shadow-sm" disabled={!selected.is_available} onClick={() => { add({ id: selected.id, name: lineName, price: selected.price }); toast.success(`${lineName} added to your bag`); }}>
          <Plus className="size-4" /> {selected.is_available ? "Add to order" : "Sold out"}
        </Button>
      </div>
    </article>
  );
}
