import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    // Let visitors open checkout and review their bag before signing in.
    // Placing an order still requires an authenticated account.
    if ((error || !data.user) && location.pathname !== "/checkout") {
      throw redirect({ to: "/auth", search: { redirect: location.pathname } });
    }
    return data.user ? { user: data.user } : {};
  },
  component: () => <Outlet />,
});