import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Phone, ShoppingBag, UserRound, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/australian-bite-logo.png";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT_PHONE_TEL } from "@/lib/format";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/orders", label: "My orders" },
  { to: "/support", label: "Support" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/88 shadow-[0_8px_30px_-24px_oklch(0.2_0.02_60/60%)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Australian Bite home" className="group flex shrink-0 items-center rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary">
          <span className="relative flex h-12 items-center overflow-hidden rounded-xl bg-card px-2 shadow-sm ring-1 ring-border/70 transition-transform duration-300 group-hover:scale-[1.02] sm:h-14 sm:px-2.5">
            <img src={logo.url} alt="Australian Bite" className="h-10 w-auto object-contain sm:h-12" />
          </span>
        </Link>

        <nav className="ml-5 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-full px-4 py-2 text-[13px] font-bold tracking-wide text-muted-foreground transition-all hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-full bg-secondary px-4 py-2 text-[13px] font-bold tracking-wide text-primary shadow-sm" }}>
              {item.label}
            </Link>
          ))}
          {isStaff && <Link to="/staff" className="rounded-full px-4 py-2 text-[13px] font-bold tracking-wide text-muted-foreground hover:bg-secondary hover:text-primary">Console</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a href={`tel:${SUPPORT_PHONE_TEL}`} className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card/70 px-4 text-xs font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary sm:flex">
            <Phone className="size-3.5" /> Call us
          </a>
          <Link to="/wishlist" aria-label="Wishlist"><Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary"><Heart className="size-[19px]" /></Button></Link>
          <Link to="/cart" aria-label="Cart" className="relative"><Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary"><ShoppingBag className="size-[19px]" /></Button>{count > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-md ring-2 ring-background">{count}</span>}</Link>
          {user ? <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="rounded-full hover:bg-secondary"><LogOut className="size-[19px]" /></Button> : <Link to="/auth"><Button size="sm" className="h-10 rounded-full px-4 font-bold shadow-sm"><UserRound className="mr-2 size-4" /> Sign in <ArrowRight className="ml-1.5 size-3.5" /></Button></Link>}
          <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setOpen(v => !v)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
        </div>
      </div>

      {open && <div className="border-t border-border/60 bg-background/98 px-4 pb-4 pt-2 shadow-lg md:hidden"><div className="mx-auto max-w-7xl space-y-1">{NAV.map(item => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition-colors hover:bg-secondary">{item.label}<ArrowRight className="size-4 text-muted-foreground" /></Link>)}{isStaff && <Link to="/staff" onClick={() => setOpen(false)} className="flex rounded-2xl px-4 py-3.5 text-sm font-bold hover:bg-secondary">Console</Link>}</div></div>}
    </header>
  );
}
