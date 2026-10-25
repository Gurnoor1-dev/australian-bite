import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Flame, Leaf, MapPin, Plus, Star, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard, type MenuItem } from "@/components/menu-item-card";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { currency, DELIVERY_FEE, type Offer } from "@/lib/format";
import { db } from "@/lib/db";

const foodImage = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85";
const friesImage = "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85";
const wingsImage = "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=85";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Australian Bite — Made for the hungry" },
    { name: "description", content: "Big flavour, no fuss. Discover Australian Bite's burgers, crispy sides and kitchen-made favourites. Order pickup or delivery." },
    { property: "og:title", content: "Australian Bite — Made for the hungry" },
    { property: "og:description", content: "Big flavour. Good mood. Your next favourite bite." },
    { property: "og:type", content: "website" },
  ] }),
  component: Home,
});

function Home() {
  const { data } = useQuery({ queryKey: ["featured-items"], queryFn: async () => {
    const { data, error } = await supabase.from("menu_items").select("*").eq("is_available", true).order("sort_order").limit(3);
    if (error) throw error;
    return data as unknown as MenuItem[];
  }});
  const { data: offers } = useQuery({ queryKey: ["home-offers"], queryFn: async () => {
    const { data, error } = await db.from("offers").select("*").eq("is_active", true).limit(3);
    if (error) throw error;
    return (data ?? []) as Offer[];
  }});

  return <main className="bite-home overflow-hidden">
    <section className="bite-hero">
      <div className="bite-hero-noise" />
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 lg:grid-cols-[.94fr_1.06fr] lg:px-12 lg:pb-24 lg:pt-14">
        <div className="relative z-10 py-5 lg:py-12">
          <div className="bite-eyebrow"><span className="bite-pulse" /> GOOD FOOD. BIG ENERGY. <span className="ml-1">EST. FOR YOUR CRAVINGS</span></div>
          <h1 className="bite-headline mt-7">BITE<br /><span>INTO</span><br /><em>HAPPY.</em></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65 sm:text-lg">A little messy. A lot delicious. Big-hearted burgers, golden sides and the kind of food that turns a quick stop into your new ritual.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/menu"><Button className="bite-cta h-14 rounded-full px-7 text-sm font-black">Explore the menu <ArrowUpRight className="ml-2 size-4" /></Button></Link>
            <Link to="/menu" className="bite-text-link">I'm hungry already <ArrowDownRight className="size-4" /></Link>
          </div>
          <div className="mt-11 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[.13em] text-white/45"><span className="inline-flex items-center gap-2"><Flame className="size-4 text-[#c9f36b]" /> Made fresh</span><span className="inline-flex items-center gap-2"><Truck className="size-4 text-[#c9f36b]" /> Pickup + delivery</span><span className="inline-flex items-center gap-2"><Leaf className="size-4 text-[#c9f36b]" /> Good ingredients</span></div>
        </div>
        <div className="bite-visual-wrap">
          <div className="bite-stamp"><span>GOOD<br />MOOD</span><Star className="size-5 fill-current" /><span>FOOD</span></div>
          <div className="bite-image-main"><img src={foodImage} alt="Juicy grilled burger with fresh toppings" /><div className="bite-image-shade" /></div>
          <div className="bite-float-card"><span className="bite-card-kicker">THE CROWD PLEASER</span><strong>Stacked.<br />Saucy. Serious.</strong><Link to="/menu" aria-label="Explore our menu"><ArrowUpRight className="size-5" /></Link></div>
          <div className="bite-side-note">FRESH OFF<br />THE GRILL <span>↗</span></div>
          <div className="bite-vertical-label">AUSTRALIAN BITE · YOUR NEW LOCAL</div>
        </div>
      </div>
      <div className="bite-marquee" aria-label="Australian Bite food slogan"><div>BIG FLAVOUR <span>✳</span> NO BORING BITES <span>✳</span> GOOD MOOD FOOD <span>✳</span> BIG FLAVOUR <span>✳</span> NO BORING BITES <span>✳</span></div></div>
    </section>

    {(offers ?? []).length > 0 && <section className="mx-auto max-w-[1440px] px-5 pt-12 sm:px-8 lg:px-12"><div className="bite-section-top"><div><span className="bite-kicker">A little something extra</span><h2 className="bite-section-title">GOOD DEALS.<br /><i>GREAT DAYS.</i></h2></div><span className="bite-counter">01 / OFFERS</span></div><div className="mt-7 grid gap-4 md:grid-cols-3">{offers!.map((offer, i) => <Reveal key={offer.id} delay={i * 70}><article className="bite-offer-card"><span className="bite-offer-number">0{i + 1}</span><p className="bite-offer-code">{offer.code}</p><h3>{offer.title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{offer.description}</p></article></Reveal>)}</div></section>}

    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="bite-section-top"><div><span className="bite-kicker">Worth getting your hands messy for</span><h2 className="bite-section-title">THE <i>GOOD</i><br />STUFF.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#686b62] sm:text-base">The classics, the cravings, the “one more bite” moments. Find your next favourite.</p></div><Link to="/menu" className="bite-round-link">FULL MENU <ArrowUpRight className="size-5" /></Link></div>
      <div className="bite-feature-strip mt-10">
        <Link to="/menu" className="bite-feature-card bite-feature-burger"><img src={foodImage} alt="Signature burger" /><div className="bite-feature-overlay" /><span className="bite-feature-index">01 — THE ICON</span><div className="bite-feature-bottom"><div><h3>THE<br />STACK.</h3><p>All the good stuff, stacked high.</p></div><span className="bite-feature-arrow"><ArrowUpRight className="size-5" /></span></div></Link>
        <Link to="/menu" className="bite-feature-card bite-feature-fries"><img src={friesImage} alt="Golden crispy fries" /><div className="bite-feature-overlay" /><span className="bite-feature-index">02 — THE SIDEKICK</span><div className="bite-feature-bottom"><div><h3>GOLDEN<br />HOUR.</h3><p>Crunch time, every time.</p></div><span className="bite-feature-arrow"><ArrowUpRight className="size-5" /></span></div></Link>
        <Link to="/menu" className="bite-feature-card bite-feature-wings"><img src={wingsImage} alt="Crispy glazed chicken wings" /><div className="bite-feature-overlay" /><span className="bite-feature-index">03 — THE SAUCY ONE</span><div className="bite-feature-bottom"><div><h3>WING<br />THING.</h3><p>Finger-licking is encouraged.</p></div><span className="bite-feature-arrow"><ArrowUpRight className="size-5" /></span></div></Link>
      </div>
    </section>

    <section className="bite-menu-section">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="bite-section-top"><div><span className="bite-kicker">Straight from our kitchen</span><h2 className="bite-section-title">FAN<br /><i>FAVOURITES.</i></h2></div><span className="bite-counter">02 / THE MENU</span></div>
        {(data ?? []).length ? <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data!.map((item, i) => <Reveal key={item.id} delay={i * 70}><MenuItemCard item={item} /></Reveal>)}</div> : <div className="bite-empty-menu mt-9"><div><span className="bite-kicker">Your next favourite is waiting</span><h3>Something delicious<br />is on the menu.</h3><p>Explore the full lineup and find your kind of bite.</p></div><Link to="/menu" className="bite-cta inline-flex items-center rounded-full px-6 py-4 text-sm font-black">See the menu <ArrowRight className="ml-2 size-4" /></Link></div>}
        <div className="mt-8 flex justify-center"><Link to="/menu" className="bite-outline-cta">See everything on the menu <ArrowRight className="size-4" /></Link></div>
      </div>
    </section>

    <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[.85fr_1.15fr] md:items-center lg:px-12 lg:py-24">
      <div><span className="bite-kicker">Good food, on your schedule</span><h2 className="bite-section-title mt-4">YOU BRING<br />THE <i>HUNGER.</i></h2><p className="mt-5 max-w-md text-sm leading-7 text-[#686b62] sm:text-base">Dine on your time. Build your order, pick it up or get it delivered, and keep every detail in one place.</p><Link to="/menu" className="bite-dark-cta mt-7 inline-flex items-center rounded-full px-6 py-4 text-sm font-black">Let's get eating <ArrowRight className="ml-2 size-4" /></Link></div>
      <div className="bite-steps"><div className="bite-step"><span>01</span><div><h3>Pick your favourites</h3><p>Explore the menu and make it yours.</p></div><Plus className="size-5" /></div><div className="bite-step"><span>02</span><div><h3>Choose your timing</h3><p>Pickup, delivery or schedule it ahead.</p></div><Clock3 className="size-5" /></div><div className="bite-step"><span>03</span><div><h3>Good things are coming</h3><p>Track your order and get ready to dig in.</p></div><MapPin className="size-5" /></div><div className="bite-step-note"><span>THE BEST PART?</span><strong>You’re only a few taps away.</strong></div></div>
    </section>
    <section className="bite-last-call"><div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-12 lg:py-20"><div><span className="bite-kicker">Your stomach called</span><h2>IT SAID<br /><i>“LET'S BITE.”</i></h2></div><Link to="/menu" className="bite-cta inline-flex w-fit items-center rounded-full px-7 py-4 text-sm font-black">Order your happy <ArrowUpRight className="ml-2 size-4" /></Link></div></section>
    <div className="mx-auto max-w-[1440px] px-5 pb-6 text-xs text-[#77796e] sm:px-8 lg:px-12"><div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5"><span>GOOD FOOD. GOOD MOOD. AUSTRALIAN BITE.</span><span>Delivery fee from {currency(DELIVERY_FEE)} · Made fresh, always.</span></div></div>
  </main>;
}
