import { useState, type SyntheticEvent } from "react";
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
  image_url?: string | null;
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

const FOOD_IMAGES = {
  pizza: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
  fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
  biryani: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80",
  curry: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
  shake: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80",
  wrap: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
  wings: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80",
  pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
  noodles: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80",
  dumplings: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
  dosa: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=80",
  samosa: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  dessert: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
  iceCream: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80",
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  friedChicken: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
  tikka: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80",
  bread: "https://images.unsplash.com/photo-1619531040576-f9416740661e?auto=format&fit=crop&w=900&q=80",
  soup: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  seafood: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80",
  default: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
};

function foodImageFor(item: Pick<MenuItem, "name" | "image_url">) {
  const storedImage = item.image_url?.trim();
  if (storedImage) return storedImage;

  const value = item.name.toLowerCase();
  if (/pizza|margherita/.test(value)) return FOOD_IMAGES.pizza;
  if (/burger|hamburger|zinger|cheeseburger/.test(value)) return FOOD_IMAGES.burger;
  if (/fries|french fry|potato wedges|wedges/.test(value)) return FOOD_IMAGES.fries;
  if (/biryani|pulao|fried rice|rice bowl/.test(value)) return FOOD_IMAGES.biryani;
  if (/paneer|butter chicken|curry|masala|dal|korma|makhani|chole|rajma|gravy/.test(value)) return FOOD_IMAGES.curry;
  if (/tikka|tandoori|kebab|kabab|seekh/.test(value)) return FOOD_IMAGES.tikka;
  if (/wing|drumstick/.test(value)) return FOOD_IMAGES.wings;
  if (/nugget|popcorn chicken|fried chicken|crispy chicken/.test(value)) return FOOD_IMAGES.friedChicken;
  if (/wrap|roll|frankie|shawarma/.test(value)) return FOOD_IMAGES.wrap;
  if (/sandwich|sub|toast|grill/.test(value)) return FOOD_IMAGES.sandwich;
  if (/momo|dumpling|dimsum/.test(value)) return FOOD_IMAGES.dumplings;
  if (/noodle|chow mein|hakka/.test(value)) return FOOD_IMAGES.noodles;
  if (/pasta|macaroni|spaghetti|lasagna/.test(value)) return FOOD_IMAGES.pasta;
  if (/dosa|idli|uttapam/.test(value)) return FOOD_IMAGES.dosa;
  if (/samosa|pakora|pakoda|spring roll/.test(value)) return FOOD_IMAGES.samosa;
  if (/cake|brownie|pastry|dessert|donut|doughnut|muffin/.test(value)) return FOOD_IMAGES.dessert;
  if (/ice cream|sundae|kulfi/.test(value)) return FOOD_IMAGES.iceCream;
  if (/shake|smoothie|lassi|juice|lemonade|mojito|cold drink|soft drink/.test(value)) return FOOD_IMAGES.shake;
  if (/tea|coffee|cappuccino|espresso/.test(value)) return FOOD_IMAGES.coffee;
  if (/salad|healthy/.test(value)) return FOOD_IMAGES.salad;
  if (/soup/.test(value)) return FOOD_IMAGES.soup;
  if (/naan|roti|paratha|bread|garlic bread/.test(value)) return FOOD_IMAGES.bread;
  if (/fish|prawn|seafood|shrimp/.test(value)) return FOOD_IMAGES.seafood;
  return FOOD_IMAGES.default;
}

function handleFoodImageError(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === "true") return;
  image.dataset.fallbackApplied = "true";
  image.src = fallback;
}

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
      <div className="bite-product-photo">
        <img src={foodImageFor(item)} alt={item.name} loading="lazy" decoding="async" onError={(event) => handleFoodImageError(event, foodImageFor({ name: item.name, image_url: null }))} />
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
