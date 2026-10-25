import { Link } from "@tanstack/react-router";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { MapPin, Phone, Clock, ArrowUpRight, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/australian-bite-logo.png";
import { SUPPORT_PHONE, SUPPORT_PHONE_TEL, STORE_ADDRESS, STORE_HOURS, FESTIVAL_PRICING_NOTE } from "@/lib/format";

export function SiteFooter() {
  const { data: store } = useStoreSettings();
  const phone = store?.phone || SUPPORT_PHONE;
  const phoneTel = phone.replace(/[^+0-9]/g, "");
  const address = store?.address || STORE_ADDRESS;
  const hours = store?.opening_hours || STORE_HOURS;
  const festivalNote = store?.festival_pricing_note || FESTIVAL_PRICING_NOTE;
  return (
    <footer className="relative mt-24 overflow-hidden bg-charcoal text-charcoal-foreground">
      <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.45fr_.7fr_1fr_1fr]">
          <div>
            <Link to="/" aria-label="Australian Bite home" className="inline-flex rounded-2xl bg-background p-2.5 shadow-xl ring-1 ring-white/10 transition-transform hover:-translate-y-0.5">
              <img src={logo} alt="Australian Bite" className="h-14 w-auto object-contain sm:h-16" />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-charcoal-foreground/65">Pizzas, Indian favourites, biryani, shakes and sides — made for good meals in Pehowa. Find your next favourite and give us a call if you need a hand.</p>
            <div className="mt-6 flex gap-2"><a aria-label="Instagram" href="#" className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"><Instagram className="size-4" /></a><a aria-label="Facebook" href="#" className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground"><Facebook className="size-4" /></a></div>
          </div>
          <div><h3 className="text-xs font-black uppercase tracking-[.2em] text-charcoal-foreground/45">Explore</h3><ul className="mt-5 space-y-3 text-sm font-semibold"><li><Link to="/menu" className="transition hover:text-primary">Menu</Link></li><li><Link to="/orders" className="transition hover:text-primary">Order history</Link></li><li><Link to="/wishlist" className="transition hover:text-primary">Wishlist</Link></li><li><Link to="/support" className="transition hover:text-primary">Support</Link></li></ul></div>
          <div><h3 className="text-xs font-black uppercase tracking-[.2em] text-charcoal-foreground/45">Find us</h3><ul className="mt-5 space-y-4 text-sm leading-6 text-charcoal-foreground/75"><li className="flex gap-3"><MapPin className="mt-1 size-4 shrink-0 text-primary" /><span>{address}</span></li><li className="flex gap-3"><Clock className="mt-1 size-4 shrink-0 text-primary" /><span>Daily<br />{hours}</span></li><li className="flex gap-3"><Phone className="mt-1 size-4 shrink-0 text-primary" /><a href={`tel:${phoneTel}`} className="hover:text-primary">{phone}</a></li></ul></div>
          <div><h3 className="text-xs font-black uppercase tracking-[.2em] text-charcoal-foreground/45">Order with confidence</h3><div className="mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-5"><p className="font-display text-xl uppercase tracking-wide">Your bite. Your way.</p><p className="mt-2 text-sm leading-6 text-charcoal-foreground/60">Every order gets a unique reference. Keep it handy if you need a hand from our crew.</p><Link to="/menu" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary hover:gap-3">Start an order <ArrowUpRight className="size-4" /></Link></div></div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-charcoal-foreground/45 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Australian Bite Restaurant. All rights reserved.</p><p>{festivalNote}</p></div>
      </div>
    </footer>
  );
}
