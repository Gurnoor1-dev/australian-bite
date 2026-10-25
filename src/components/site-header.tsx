import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Heart, LogOut, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "The menu" },
  { to: "/orders", label: "My orders" },
  { to: "/support", label: "Say hello" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return <header className="bite-header sticky top-0 z-50">
    <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-3 px-5 sm:px-8 lg:px-12">
      <Link to="/" aria-label="Australian Bite home" className="bite-brand">
        <span className="bite-brand-mark">AB<span>✳</span></span>
        <span className="bite-brand-name">AUSTRALIAN<br />BITE<span className="bite-brand-dot">.</span></span>
      </Link>
      <nav className="ml-8 hidden items-center gap-1 md:flex">
        {NAV.map(item => <Link key={item.to} to={item.to} className="bite-nav-link" activeProps={{ className: "bite-nav-link bite-nav-active" }}>{item.label}</Link>)}
        {isStaff && <Link to="/staff" className="bite-nav-link">Kitchen console</Link>}
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <Link to="/wishlist" aria-label="Wishlist" className="bite-icon-link hidden sm:grid"><Heart className="size-[18px]" /></Link>
        <Link to="/cart" aria-label="Cart" className="bite-cart-link"><ShoppingBag className="size-[18px]" /><span>Bag{count > 0 ? ` · ${count}` : ""}</span></Link>
        {user ? <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="rounded-full"><LogOut className="size-[18px]" /></Button> : <Link to="/auth" className="bite-signin hidden sm:inline-flex">Sign in <ArrowUpRight className="size-4" /></Link>}
        <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setOpen(v => !v)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
      </div>
    </div>
    {open && <div className="bite-mobile-menu px-5 pb-4 pt-2 md:hidden"><div className="mx-auto max-w-[1440px] space-y-1">{NAV.map(item => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold">{item.label}<ArrowRight className="size-4" /></Link>)}{isStaff && <Link to="/staff" onClick={() => setOpen(false)} className="flex px-4 py-3 text-sm font-bold">Kitchen console</Link>}{!user && <Link to="/auth" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl bg-[#c9f36b] px-4 py-3 text-sm font-black">Sign in <ArrowUpRight className="size-4" /></Link>}</div></div>}
  </header>;
}
