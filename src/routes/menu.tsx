import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/lib/wishlist";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Australian Bite Restaurant" },
      {
        name: "description",
        content:
          "Browse the full Australian Bite menu: flame-grilled burgers, bushfire wings, loaded chips, wraps, drinks and desserts. Order for pickup or delivery.",
      },
      { property: "og:title", content: "Menu — Australian Bite Restaurant" },
      { property: "og:description", content: "Flame-grilled burgers, wings, wraps, drinks and desserts." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { user } = useAuth();
  const { ids, toggle } = useWishlist(user?.id);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const [categories, items] = await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("sort_order"),
      ]);
      if (categories.error) throw categories.error;
      if (items.error) throw items.error;
      return { categories: categories.data, items: items.data as unknown as MenuItem[] };
    },
  });

  const items = (data?.items ?? []).filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || item.name.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-display text-4xl sm:text-5xl">The Menu</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Everything is cooked to order. Add to your bag, schedule a time, and we'll take it from there.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the menu…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <CategoryChip active={activeCategory === "all"} onClick={() => setActiveCategory("all")} label="All" />
          {(data?.categories ?? []).map((c) => (
            <CategoryChip
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              label={c.name}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading the menu…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Nothing matches that search.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              saved={ids.has(item.id)}
              onToggleSave={(i) => void toggle(i.id, i.name)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"
      }`}
    >
      {label}
    </button>
  );
}