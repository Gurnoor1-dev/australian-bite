import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useWishlist(userId?: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!userId) {
      setIds(new Set());
      return;
    }
    const { data } = await supabase.from("wishlist_items").select("menu_item_id").eq("user_id", userId);
    setIds(new Set((data ?? []).map((row) => row.menu_item_id)));
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (menuItemId: string, name: string) => {
      if (!userId) {
        toast.error("Sign in to save favourites");
        return;
      }
      if (ids.has(menuItemId)) {
        await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("menu_item_id", menuItemId);
        toast(`${name} removed from wishlist`);
      } else {
        await supabase.from("wishlist_items").insert({ user_id: userId, menu_item_id: menuItemId });
        toast.success(`${name} saved to wishlist`);
      }
      await refresh();
    },
    [ids, refresh, userId],
  );

  return { ids, toggle, refresh };
}