import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [addonsOpen, setAddonsOpen] = useState(false);
  const [addons, setAddons] = useState<{id:string;name:string;description:string|null;price:number}[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
  useEffect(() => { if (!addonsOpen) return; let live = true; setAddonsLoading(true); supabase.from("add_on_options").select("id,name,description,price,category_id").eq("is_available",true).or(`category_id.is.null,category_id.eq.${item.category_id}`).order("sort_order").then(({data,error}) => { if (!live) return; if (error) toast.error("Could not load extras"); setAddons((data ?? []).map((x:any)=>({...x,price:Number(x.price)}))); setAddonsLoading(false); }); return () => { live = false; }; }, [addonsOpen]);
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
        <Button size="sm" className="bite-product-add mt-4 h-11 w-full rounded-xl font-extrabold shadow-sm" disabled={!selected.is_available} onClick={() => { setSelectedAddons([]); setAddonsOpen(true); }}>
          <Plus className="size-4" /> {selected.is_available ? "Add to order" : "Sold out"}
        </Button>
      </div>
      {addonsOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)setAddonsOpen(false)}}><section role="dialog" aria-modal="true" aria-labelledby={`extras-title-${item.id}`} className="max-h-[88dvh] w-full max-w-lg animate-in slide-in-from-bottom-4 overflow-y-auto rounded-t-[28px] border border-border bg-card p-5 shadow-2xl duration-200 sm:rounded-[28px] sm:animate-in sm:zoom-in-95"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Make it yours</p><h3 id={`extras-title-${item.id}`} className="mt-1 text-2xl font-black">Add extras</h3><p className="mt-1 text-sm text-muted-foreground">{lineName} · choose up to 6</p></div><button type="button" onClick={()=>setAddonsOpen(false)} aria-label="Close add-ons" className="grid size-9 place-items-center rounded-full bg-secondary text-lg">×</button></div><div className="mt-4 divide-y divide-border">{addonsLoading?<p className="py-8 text-center text-sm text-muted-foreground">Loading extras…</p>:addons.map((a)=>{const checked=selectedAddons.includes(a.id);return <label key={a.id} className="flex cursor-pointer items-center gap-3 py-3"><input type="checkbox" checked={checked} disabled={!checked&&selectedAddons.length>=6} onChange={()=>setSelectedAddons(prev=>checked?prev.filter(id=>id!==a.id):[...prev,a.id])} className="size-4 accent-primary"/><span className="min-w-0 flex-1"><span className="block font-bold">{a.name}</span>{a.description&&<span className="mt-0.5 block text-xs text-muted-foreground">{a.description}</span>}</span><span className="text-sm font-black">{a.price===0?"Free":`+${currency(a.price)}`}</span></label>})}{!addonsLoading&&!addons.length&&<p className="py-6 text-sm text-muted-foreground">No extras available right now. You can still add your item.</p>}</div><div className="mt-4 rounded-2xl bg-secondary/70 p-4"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Item</span><span>{currency(selected.price)}</span></div><div className="mt-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Extras</span><span>{currency(addons.filter(a=>selectedAddons.includes(a.id)).reduce((sum,a)=>sum+a.price,0))}</span></div><div className="mt-3 flex items-center justify-between border-t border-border pt-3"><span className="font-black">Item total</span><span className="text-xl font-black">{currency(selected.price+addons.filter(a=>selectedAddons.includes(a.id)).reduce((sum,a)=>sum+a.price,0))}</span></div></div><Button className="mt-4 h-12 w-full rounded-xl font-black" onClick={()=>{const picked=addons.filter(a=>selectedAddons.includes(a.id));const key=`${selected.id}::${picked.map(a=>a.id).sort().join(",")}`;const total=selected.price+picked.reduce((sum,a)=>sum+a.price,0);add({id:key,menuItemId:selected.id,name:lineName,price:total,addons:picked});setAddonsOpen(false);toast.success(`${lineName} added to your bag`);}}><Plus className="mr-2 size-4"/>Add to bag · {currency(selected.price+addons.filter(a=>selectedAddons.includes(a.id)).reduce((sum,a)=>sum+a.price,0))}</Button></section></div>}
      </div>
    </article>
  );
}
