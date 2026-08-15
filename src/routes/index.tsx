import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Phone, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { Button } from "@/components/ui/button";
import { SUPPORT_PHONE, SUPPORT_PHONE_TEL } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Australian Bite — Flame-grilled Aussie burgers, delivered" },
      {
        name: "description",
        content:
          "Australian Bite serves flame-grilled burgers, bushfire wings and loaded chips. Order online for pickup or delivery, schedule ahead and track your order live.",
      },
      { property: "og:title", content: "Australian Bite — Flame-grilled Aussie burgers" },
      {
        property: "og:description",
        content: "Order online for pickup or delivery, schedule ahead and track every order live.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("sort_order")
        .limit(6);
      if (error) throw error;
      return data as unknown as MenuItem[];
    },
  });

  return (
    <main>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <Flame className="size-3.5 text-primary" /> Cooked to order
            </span>
            <h1 className="text-display mt-4 text-5xl leading-[0.95] sm:text-7xl">
              Big Aussie flavour,
              <br /> served fast.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Flame-grilled burgers, bushfire wings and loaded chips. Order for pickup or delivery,
              schedule it for later, and watch your order move from the grill to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu">
                <Button size="lg">Order now</Button>
              </Link>
              <a href={`tel:${SUPPORT_PHONE_TEL}`}>
                <Button size="lg" variant="outline" className="gap-2">
                  <Phone className="size-4" /> {SUPPORT_PHONE}
                </Button>
              </a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Perk icon={<Truck className="size-5 text-primary" />} title="Pickup or delivery" body="Flat $6.90 delivery across the inner suburbs." />
            <Perk icon={<Clock className="size-5 text-primary" />} title="Schedule ahead" body="Pick a time today or later this week — we'll time the grill." />
            <Perk icon={<Phone className="size-5 text-primary" />} title="Real humans" body="Live chat with the crew, or call the store direct." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-display text-3xl sm:text-4xl">Crowd favourites</h2>
            <p className="mt-2 text-muted-foreground">The ones people come back for.</p>
          </div>
          <Link to="/menu" className="text-sm font-bold uppercase tracking-wide text-primary">
            See full menu →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
