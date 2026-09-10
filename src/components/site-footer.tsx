import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock } from "lucide-react";
import logo from "@/assets/australian-bite-logo.png";
import { SUPPORT_PHONE, SUPPORT_PHONE_TEL } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-charcoal text-charcoal-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src={logo.url}
            alt="Australian Bite restaurant logo"
            className="h-16 w-auto rounded-md bg-background p-1.5"
          />
          <p className="mt-4 max-w-xs text-sm text-charcoal-foreground/70">
            Flame-grilled Aussie classics, served fast and served proper. Order ahead, schedule it, or
            let us call you.
          </p>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-widest text-charcoal-foreground/60">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/menu" className="hover:text-primary">Menu</Link></li>
            <li><Link to="/orders" className="hover:text-primary">Order history</Link></li>
            <li><Link to="/wishlist" className="hover:text-primary">Wishlist</Link></li>
            <li><Link to="/support" className="hover:text-primary">Support</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-widest text-charcoal-foreground/60">Find us</h3>
          <ul className="mt-4 space-y-3 text-sm text-charcoal-foreground/80">
            <li className="flex gap-2"><MapPin className="size-4 shrink-0 text-primary" /> 128 Harbour Lane, Sydney NSW 2000</li>
            <li className="flex gap-2"><Clock className="size-4 shrink-0 text-primary" /> Every day, 10:00 – 22:30</li>
            <li className="flex gap-2">
              <Phone className="size-4 shrink-0 text-primary" />
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="hover:text-primary">{SUPPORT_PHONE}</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-widest text-charcoal-foreground/60">Order numbers</h3>
          <p className="mt-4 text-sm text-charcoal-foreground/70">
            Every order gets a unique reference like <span className="font-mono text-primary">AUSB-402913</span>.
            Quote it when you call and our crew finds you instantly.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-charcoal-foreground/50">
        © {new Date().getFullYear()} Australian Bite Restaurant. All rights reserved.
      </div>
    </footer>
  );
}
