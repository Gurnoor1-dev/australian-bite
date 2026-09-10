import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Sparkles, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/lib/wishlist";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [
    { title: "Menu — Australian Bite Restaurant" },
    { name: "description", content: "Browse the full Australian Bite menu: flame-grilled favourites, proper sides, drinks and desserts." },
  ] }),
  component: MenuPage,
});

function MenuPage() {
  const { user } = useAuth();
  const { ids, toggle } = useWishlist(user?.id);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["menu"], queryFn: async () => {
    const [categories, items] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("sort_order"),
    ]);
    if (categories.error) throw categories.error;
    if (items.error) throw items.error;
    return { categories: categories.data, items: items.data as unknown as MenuItem[] };
  }});
  const items = (data?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    return (activeCategory === "all" || item.category_id === activeCategory) && (!q || item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q));
  });

  return <main className="site-shell min-h-screen">
    <section className="bg-hero text-charcoal-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-3xl">
          <span className="section-kicker bg-white/10 text-accent"><Sparkles className="size-3" /> Cooked to order</span>
          <h1 className="text-display mt-5 text-5xl sm:text-7xl">The menu.<br /><span className="text-primary">No messing about.</span></h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">Flame-grilled favourites, loaded sides and proper comfort food. Find your next order below.</p>
        </div>
        <div className="mt-8 grid gap-3 rounded-[26px] border border-white/10 bg-white/[.07] p-3 backdrop-blur sm:grid-cols-[1fr_auto]">
          <div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search burgers, wings, sides…" className="h-12 border-white/10 bg-black/20 pl-11 text-white placeholder:text-white/40" /></div>
          <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-white/45"><SlidersHorizontal className="size-4" /> {items.length} items</div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="sticky top-[76px] z-20 -mx-2 overflow-x-auto rounded-2xl bg-background/90 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/70"><div className="flex min-w-max gap-2">
        <CategoryChip active={activeCategory === "all"} onClick={() => setActiveCategory("all")} label="All" />
        {(data?.categories ?? []).map((c) => <CategoryChip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)} label={c.name} />)}
      </div></div>
      <div className="mb-7 mt-8 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-secondary"><UtensilsCrossed className="size-5 text-primary" /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Fresh from the kitchen</p><p className="text-sm text-muted-foreground">{query ? `Showing results for “${query}”` : "Pick a favourite and make it yours."}</p></div></div>
      {isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length: 6}).map((_, i) => <div key={i} className="h-[310px] animate-pulse rounded-[28px] bg-muted" />)}</div> : items.length === 0 ? <div className="rounded-[28px] border border-dashed border-border bg-card p-12 text-center"><p className="text-lg font-black">Nothing matches that search.</p><p className="mt-2 text-sm text-muted-foreground">Try another dish or browse every category.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <MenuItemCard key={item.id} item={item} saved={ids.has(item.id)} onToggleSave={(i) => void toggle(i.id, i.name)} />)}</div>}
    </section>
  </main>;
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2.5 text-sm font-black transition ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50"}`}>{label}</button>;
}
