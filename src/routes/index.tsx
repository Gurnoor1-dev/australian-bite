import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, Flame, MapPin, Phone, Sparkles, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { currency, DELIVERY_FEE, SUPPORT_PHONE, SUPPORT_PHONE_TEL, type Offer } from "@/lib/format";
import { db } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Australian Bite — Proper Aussie flavour" },
      { name: "description", content: "Flame-grilled favourites, proper sides and bold Aussie flavour. Order pickup or delivery from Australian Bite." },
      { property: "og:title", content: "Australian Bite — Proper Aussie flavour" },
      { property: "og:description", content: "Freshly cooked favourites, ready when you are." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useQuery({ queryKey: ["featured-items"], queryFn: async () => {
    const { data, error } = await supabase.from("menu_items").select("*").eq("is_available", true).order("sort_order").limit(6);
    if (error) throw error;
    return data as unknown as MenuItem[];
  }});

  const { data: offers } = useQuery({ queryKey: ["home-offers"], queryFn: async () => {
    const { data, error } = await db.from("offers").select("*").eq("is_active", true).limit(3);
    if (error) throw error;
    return (data ?? []) as Offer[];
  }});

  return (
    <main className="site-shell overflow-hidden">
      <section className="relative bg-hero text-charcoal-foreground">
        <div className="absolute inset-0 opacity-20 soft-grid" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8 lg:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur"><Flame className="size-3.5 text-accent" /> Cooked to order</span>
            <h1 className="text-display mt-6 max-w-3xl text-6xl leading-[.9] sm:text-8xl">Big Aussie flavour.<br /><span className="text-primary">Properly done.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-charcoal-foreground/72 sm:text-lg">Flame-grilled favourites, generous sides and the kind of comfort food you plan your next order around.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu"><Button size="lg" className="h-12 rounded-xl px-6 font-black">Order now <ArrowRight className="ml-2 size-4" /></Button></Link>
              <a href={`tel:${SUPPORT_PHONE_TEL}`}><Button size="lg" variant="outline" className="h-12 rounded-xl border-white/20 bg-white/5 px-5 text-charcoal-foreground hover:bg-white/10"><Phone className="mr-2 size-4" /> {SUPPORT_PHONE}</Button></a>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs font-bold text-charcoal-foreground/60"><span className="inline-flex items-center gap-2"><Truck className="size-4 text-primary" /> Pickup + delivery</span><span className="inline-flex items-center gap-2"><Clock className="size-4 text-primary" /> Open daily</span><span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Freshly cooked</span></div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-5 rounded-[42px] bg-primary/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[.08] p-3 shadow-float backdrop-blur-sm">
                <div className="flex min-h-[360px] flex-col justify-between rounded-[28px] bg-charcoal p-6 sm:min-h-[420px]">
                  <div className="flex items-center justify-between"><span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">The good stuff</span><span className="text-xs font-bold text-white/45">AUSTRALIAN BITE</span></div>
                  <div><p className="text-display text-5xl leading-none text-white sm:text-6xl">Hot.<br />Bold.<br /><span className="text-primary">Hungry.</span></p><p className="mt-5 max-w-xs text-sm leading-6 text-white/55">Build your order, choose pickup or delivery, then follow it from kitchen to doorstep.</p></div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs font-bold text-white/50"><span className="inline-flex items-center gap-2"><MapPin className="size-3.5 text-primary" /> Sydney</span><span>Made to order</span></div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {(offers ?? []).length > 0 && <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8"><Reveal><div className="flex items-end justify-between gap-4"><div><span className="section-kicker">Limited time</span><h2 className="text-display mt-3 text-4xl sm:text-5xl">Today's offers</h2></div></div></Reveal><div className="mt-7 grid gap-4 md:grid-cols-3">{(offers ?? []).map((offer, i) => <Reveal key={offer.id} delay={i * 80}><div className="surface-lift rounded-[26px] border border-primary/20 bg-card p-6 shadow-card"><p className="text-display text-3xl text-primary">{offer.code}</p><p className="mt-2 text-base font-black">{offer.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{offer.description}</p></div></Reveal>)}</div></section>}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
        <Reveal><div className="flex flex-wrap items-end justify-between gap-5"><div><span className="section-kicker">What we're known for</span><h2 className="text-display mt-3 text-4xl sm:text-5xl">Crowd favourites</h2><p className="mt-2 text-muted-foreground">The ones worth coming back for.</p></div><Link to="/menu" className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-black shadow-sm transition hover:border-primary/40 hover:text-primary">See full menu <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div></Reveal>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(data ?? []).map((item, i) => <Reveal key={item.id} delay={(i % 3) * 70}><MenuItemCard item={item} /></Reveal>)}</div>
      </section>

      <section className="border-y border-border bg-secondary/45"><div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8"><Perk icon={<Truck className="size-5 text-primary" />} title="Pickup or delivery" body={`Flat ${currency(DELIVERY_FEE)} delivery across the city.`} /><Perk icon={<Clock className="size-5 text-primary" />} title="Schedule ahead" body="Choose a time that suits you and we'll have it ready." /><Perk icon={<Phone className="size-5 text-primary" />} title="Real humans" body="Need a hand? Call the store and talk to the crew." /></div></section>
    </main>
  );
}

function Perk({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="rounded-[24px] border border-border/70 bg-card/80 p-5 shadow-sm"><div className="flex items-center gap-3">{icon}<h3 className="text-base font-black">{title}</h3></div><p className="mt-2 pl-8 text-sm leading-6 text-muted-foreground">{body}</p></div>;
}
