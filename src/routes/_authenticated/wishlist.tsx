import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/lib/wishlist";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Australian Bite" },
      { name: "description", content: "Your saved Australian Bite favourites, ready to reorder in a tap." },
      { property: "og:title", content: "Wishlist — Australian Bite" },
      { property: "og:description", content: "Your saved favourites, ready to reorder." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const { ids, toggle } = useWishlist(user?.id);

  const { data } = useQuery({
    queryKey: ["wishlist-items", [...ids].sort().join(",")],
    enabled: ids.size > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").in("id", [...ids]);
      if (error) throw error;
      return data as unknown as MenuItem[];
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-display text-4xl">Your wishlist</h1>
      {ids.size === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-muted-foreground">Nothing saved yet. Tap the heart on any menu item.</p>
          <Link to="/menu" className="mt-4 inline-block">
            <Button>Browse the menu</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((item) => (
            <MenuItemCard key={item.id} item={item} saved onToggleSave={(i) => void toggle(i.id, i.name)} />
          ))}
        </div>
      )}
    </main>
  );
}
