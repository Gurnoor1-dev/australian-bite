import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Sparkles, UtensilsCrossed, Leaf, Drumstick, Pizza, Gift, TicketPercent, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { menuSupabase } from "@/integrations/supabase/menu-client";
import { MenuItemCard, type MenuItem, type MenuVariant } from "@/components/menu-item-card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type RawMenuItem = MenuItem & { variant: string; item_type: "Veg" | "Non-Veg" };

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [
    { title: "The Menu | Australian Bite, Pehowa" },
    { name: "description", content: "Explore Australian Bite's full menu in Pehowa: pizzas, Indian curries, biryani, shakes, sides and more. Clear prices in INR." },
  ] }),
  component: MenuPage,
});

function MenuPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [foodType, setFoodType] = useState<"all" | "Veg" | "Non-Veg">("all");
  const { data: activeOffers = [] } = useQuery({
    queryKey: ["australian-bite-active-offers"],
    queryFn: async () => {
      const result = await menuSupabase.from("offers").select("id,code,title,description,discount_type,discount_value,min_order,max_discount,valid_until,target_menu_item_id,buy_quantity,free_quantity").eq("is_active", true).order("created_at", { ascending: false }).limit(12);
      if (result.error) throw result.error;
      return (result.data ?? []).filter((offer: any) => !offer.valid_until || Date.parse(offer.valid_until) > Date.now());
    },
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["australian-bite-menu"],
    queryFn: async () => {
      const [categoriesResult, itemsResult] = await Promise.all([
        menuSupabase.from("menu_categories").select("id,name,sort_order").order("sort_order"),
        menuSupabase.from("menu_items").select("id,category_id,name,variant,price,item_type,is_available,is_vegetarian,is_spicy,calories,description,sort_order").eq("is_available", true).order("sort_order"),
      ]);
      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      const rawItems = (itemsResult.data ?? []) as RawMenuItem[];
      const groups = new Map<string, MenuItem>();
      for (const row of rawItems) {
        const key = `${row.category_id}::${row.name}`;
        const variant: MenuVariant = { id: row.id, variant: row.variant || "Standard", price: Number(row.price), is_available: row.is_available, item_type: row.item_type };
        const current = groups.get(key);
        if (current) {
          current.variantOptions = [...(current.variantOptions ?? []), variant];
        } else {
          groups.set(key, { ...row, price: Number(row.price), variantOptions: [variant] });
        }
      }
      return { categories: categoriesResult.data ?? [], items: [...groups.values()] };
    },
  });

  const items = useMemo(() => (data?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    const matchesType = foodType === "all" || item.item_type === foodType;
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesType && matchesSearch;
  }), [data?.items, activeCategory, foodType, query]);

  return <main className="bite-menu-page min-h-screen">
    <section className="bite-menu-hero">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="bite-menu-hero-grid">
          <div className="max-w-3xl">
            <span className="bite-kicker text-[#c9f36b]"><Sparkles className="mr-2 inline size-3" /> Fresh from our kitchen · Pehowa</span>
            <h1 className="bite-menu-title">BIG CRAVINGS.<br /><i>PROPER FLAVOUR.</i></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">From hot, cheesy pizzas to comforting curries, biryani, cold shakes and little extras. Find your favourite, choose your size, and make it a good meal.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider text-white/70"><span className="bite-menu-proof"><Pizza className="size-4 text-[#c9f36b]" /> Pizza, your way</span><span className="bite-menu-proof"><Leaf className="size-4 text-[#c9f36b]" /> Veg options</span><span className="bite-menu-proof"><Drumstick className="size-4 text-[#f28a65]" /> Non-veg favourites</span></div>
          </div>
          <div className="bite-menu-photo"><img src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1100&q=85" alt="Freshly baked pizza with bubbling cheese" /><div><span>MADE FOR SHARING</span><strong>One more<br />slice?</strong></div></div>
        </div>
        <div className="bite-menu-search mt-10">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pizza, paneer, biryani, shakes…" className="h-12 border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/40 focus-visible:ring-[#c9f36b]" /></div>
          <span className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-white/50"><SlidersHorizontal className="size-4" /> {items.length} dishes</span>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-5 pb-10 pt-8 sm:px-8 lg:px-12">
      {activeOffers.length > 0 && <section aria-label="Live offers" className="bite-offers-section mb-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-primary"><Sparkles className="size-4" /> The good-deal zone</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">A little extra <span className="text-primary">happy.</span></h2></div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">{activeOffers.length} live {activeOffers.length === 1 ? "offer" : "offers"}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{activeOffers.map((offer: any, index: number) => {
          const target = offer.target_menu_item_id ? data?.items.find((item) => item.id === offer.target_menu_item_id || item.variantOptions?.some((variant) => variant.id === offer.target_menu_item_id)) : undefined;
          const targetVariant = target?.variantOptions?.find((variant) => variant.id === offer.target_menu_item_id);
          const headline = offer.discount_type === "bogo" ? `BUY ${offer.buy_quantity} · GET ${offer.free_quantity} FREE` : offer.discount_type === "percent" ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`;
          return <article key={offer.id} className={`bite-offer-card bite-offer-card-${index % 3} group relative overflow-hidden rounded-[26px] border border-border bg-card p-5 shadow-card`}>
            <div className="bite-offer-orb" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#c9f36b] text-[#171a15]"><Gift className="size-5" /></span><span className="rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em]">{offer.discount_type === "bogo" ? "Crowd favourite" : "Limited-time treat"}</span></div>
            <p className="relative mt-4 text-xs font-black uppercase tracking-[.16em] text-primary">{headline}</p>
            <h3 className="relative mt-1 text-2xl font-black leading-tight">{offer.title}</h3>
            <p className="relative mt-2 min-h-10 text-sm leading-6 text-muted-foreground">{offer.description || (offer.discount_type === "bogo" ? `Buy ${offer.buy_quantity} and get ${offer.free_quantity} free on ${target?.name || "the featured dish"}.` : "A little something off your next delicious order.")}</p>
            <div className="relative mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 font-mono text-sm font-black tracking-widest"><TicketPercent className="size-4 text-primary" />{offer.code}</span><span className="text-xs text-muted-foreground">Min. order {new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(offer.min_order || 0))}</span></div>
            {offer.discount_type === "bogo" && targetVariant && <p className="relative mt-2 text-xs font-bold text-muted-foreground">Featured: {target?.name} · {targetVariant.variant} · ₹{targetVariant.price}</p>}
            <button type="button" className="bite-offer-cta relative mt-4 flex w-full items-center justify-between rounded-xl bg-[#171a15] px-4 py-3 text-sm font-black text-white" onClick={() => {
              window.sessionStorage.setItem("australian-bite-promo-code", offer.code);
              if (target) { setQuery(target.name); setActiveCategory(target.category_id); }
              document.getElementById("bite-menu-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
              toast.success(target ? `${offer.code} selected — add ${target.name}, then apply the code at checkout.` : `${offer.code} saved for checkout.`);
            }}><span>{target ? "Find the dish & unlock" : "Save offer for checkout"}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
          </article>;
        })}</div>
      </section>}
      <div className="bite-filter-bar">
        <div className="bite-category-scroll"><CategoryChip active={activeCategory === "all"} onClick={() => setActiveCategory("all")} label="Everything" />{(data?.categories ?? []).map((category) => <CategoryChip key={category.id} active={activeCategory === category.id} onClick={() => setActiveCategory(category.id)} label={category.name} />)}</div>
        <div className="bite-type-filters" aria-label="Filter by food type"><button type="button" className={foodType === "all" ? "active" : ""} onClick={() => setFoodType("all")}>All</button><button type="button" className={foodType === "Veg" ? "active" : ""} onClick={() => setFoodType("Veg")}>Veg</button><button type="button" className={foodType === "Non-Veg" ? "active" : ""} onClick={() => setFoodType("Non-Veg")}>Non-veg</button></div>
      </div>
      <div className="mb-7 mt-8 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-secondary"><UtensilsCrossed className="size-5 text-primary" /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Good food, your call</p><p className="text-sm text-muted-foreground">{query ? `Showing results for “${query}”` : "Choose a category, pick a size, and order your favourites."}</p></div></div>
      {isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length: 6}).map((_, i) => <div key={i} className="h-[330px] animate-pulse rounded-[26px] bg-muted" />)}</div> : isError ? <div className="rounded-[26px] border border-rose-200 bg-rose-50 p-8 text-center"><p className="font-black text-rose-900">The menu couldn't load just now.</p><p className="mt-2 text-sm text-rose-800">Please refresh the page or call us and we'll help you choose.</p></div> : items.length === 0 ? <div className="rounded-[26px] border border-dashed border-border bg-card p-12 text-center"><p className="text-lg font-black">Nothing matches that search.</p><p className="mt-2 text-sm text-muted-foreground">Try another dish or browse every category.</p><button type="button" className="mt-4 text-sm font-black text-primary underline" onClick={() => { setQuery(""); setActiveCategory("all"); setFoodType("all"); }}>Clear filters</button></div> : <div id="bite-menu-grid" className="grid scroll-mt-28 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <MenuItemCard key={item.id} item={item} />)}</div>}
      <div className="mt-12 rounded-[26px] bg-[#171a15] p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8"><div><span className="text-xs font-black uppercase tracking-[.18em] text-[#c9f36b]">Need a recommendation?</span><h2 className="mt-2 font-display text-2xl font-black">We're just around the corner.</h2><p className="mt-2 text-sm text-white/60">Near NH-152, Kurukshetra Road, Pehowa.</p></div><a href="tel:+917404339777" className="mt-5 inline-flex items-center justify-center rounded-full bg-[#c9f36b] px-5 py-3 text-sm font-black text-[#171a15] sm:mt-0">Call +91 74043 39777</a></div>
    </section>
  </main>;
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className={`bite-category-chip ${active ? "active" : ""}`}>{label}</button>;
}
