import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Phone, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { currency, DELIVERY_FEE, SUPPORT_PHONE, SUPPORT_PHONE_TEL, type Offer } from "@/lib/format";
import { db } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AU Bite — Flame-grilled burgers & rolls, delivered in India" },
      {
        name: "description",
        content:
          "AU Bite serves flame-grilled burgers, peri-peri wings, kathi rolls and masala fries. Order online for pickup or delivery, pay by UPI and track your order live.",
      },
      { property: "og:title", content: "AU Bite — Flame-grilled burgers & rolls" },
      {
        property: "og:description",
        content: "Order online for pickup or delivery, pay with UPI and track every order live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

  const { data: offers } = useQuery({
    queryKey: ["home-offers"],
    queryFn: async () => {
      const { data, error } = await db.from("offers").select("*").eq("is_active", true).limit(3);
      if (error) throw error;
      return (data ?? []) as Offer[];
    },
  });

  return (
    <main>
      <section className="bg-hero text-charcoal-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-foreground text-xs font-bold uppercase tracking-widest">
              <Flame className="size-3.5 text-primary" /> Cooked to order
            </span>
            <h1 className="text-display mt-4 text-5xl leading-[0.95] sm:text-7xl">
              Big Aussie flavour,
              <br /> desi spice.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-charcoal-foreground/75">
              Flame-grilled burgers, peri-peri wings, kathi rolls and masala fries. Order for pickup or
              delivery, pay with UPI, schedule it for later and track it live.
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
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Reveal delay={80}>
              <Perk
                icon={<Truck className="size-5 text-primary" />}
                title="Pickup or delivery"
                body={`Flat ${currency(DELIVERY_FEE)} delivery across the city.`}
              />
            </Reveal>
            <Reveal delay={160}>
              <Perk icon={<Clock className="size-5 text-primary" />} title="Schedule ahead" body="Pick a slot today or later this week — we'll time the grill." />
            </Reveal>
            <Reveal delay={240}>
              <Perk icon={<Phone className="size-5 text-primary" />} title="Real humans" body="Live chat with the crew, or call the store direct." />
            </Reveal>
          </div>
        </div>
      </section>

      {(offers ?? []).length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <Reveal>
            <h2 className="text-display text-3xl sm:text-4xl">Today's offers</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(offers ?? []).map((offer, i) => (
              <Reveal key={offer.id} delay={i * 90}>
                <div className="rounded-3xl border border-dashed border-primary bg-card p-5 shadow-card">
                  <p className="text-display text-2xl text-primary">{offer.code}</p>
                  <p className="mt-1 font-bold">{offer.title}</p>
                  <p className="text-sm text-muted-foreground">{offer.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-display text-3xl sm:text-4xl">Crowd favourites</h2>
              <p className="mt-2 text-muted-foreground">The ones people come back for.</p>
            </div>
            <Link to="/menu" className="text-sm font-bold uppercase tracking-wide text-primary">
              See full menu →
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 90}>
              <MenuItemCard item={item} />
            </Reveal>
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
