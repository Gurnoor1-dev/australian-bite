import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, LogOut, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/australian-bite-logo.png";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "The menu" },
  { to: "/customer-dashboard", label: "My account" },
  { to: "/orders", label: "My orders" },
  { to: "/support", label: "Say hello" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return <header className="bite-header sticky top-0 z-50">
    <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-3 px-5 sm:px-8 lg:px-12">
      <Link to="/" aria-label="Australian Bite home" className="bite-brand">
        <img src={logo} alt="Australian Bite" className="bite-brand-logo" />
      </Link>
      <nav aria-label="Main navigation" className="bite-main-nav ml-8 hidden items-center gap-1 md:flex">
        {NAV.map(item => <Link key={item.to} to={item.to} className="bite-nav-link" activeProps={{ className: "bite-nav-link bite-nav-active" }}>{item.label}</Link>)}
        {isStaff && <Link to="/store-dashboard" className="bite-nav-link">Store control</Link>}{isAdmin && <Link to="/admin-dashboard" className="bite-nav-link">Owner control</Link>}
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <Link to="/wishlist" aria-label="Wishlist" className="bite-icon-link hidden sm:grid"><Heart className="size-[18px]" /></Link>
        <Link to="/cart" aria-label="Cart" className="bite-cart-link"><ShoppingBag className="size-[18px]" /><span>Bag{count > 0 ? ` · ${count}` : ""}</span></Link>
        {user ? <><Link to="/customer-dashboard" aria-label="My account" className="bite-icon-link hidden sm:grid"><UserRound className="size-[18px]" /></Link><Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="rounded-full"><LogOut className="size-[18px]" /></Button></> : <Link to="/auth" className="bite-signin hidden sm:inline-flex">Sign in <ArrowUpRight className="size-4" /></Link>}
        <Button variant="ghost" size="icon" className="bite-menu-toggle rounded-full md:hidden" onClick={() => setOpen(v => !v)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
      </div>
    </div>
    <div className={`bite-mobile-panel md:hidden ${open ? "is-open" : ""}`} aria-hidden={!open}><div className="mx-auto max-w-[1440px] space-y-1 px-5 pb-4 pt-2 sm:px-8">{NAV.map((item, index) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} style={{ "--nav-index": index } as React.CSSProperties} className="bite-mobile-link">{item.label}<ArrowRight className="size-4" /></Link>)}{isStaff && <Link to="/store-dashboard" onClick={() => setOpen(false)} className="bite-mobile-link">Store control<ArrowRight className="size-4" /></Link>}{isAdmin && <Link to="/admin-dashboard" onClick={() => setOpen(false)} className="bite-mobile-link">Owner control<ArrowRight className="size-4" /></Link>}{!user && <Link to="/auth" onClick={() => setOpen(false)} className="bite-mobile-link bite-mobile-signin">Sign in <ArrowUpRight className="size-4" /></Link>}</div></div>
  </header>;
}
