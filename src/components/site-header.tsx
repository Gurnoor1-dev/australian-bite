import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Phone, ShoppingBag, UserRound, X } from "lucide-react";
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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="Australian Bite restaurant logo" className="h-11 w-auto" />
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/staff"
              className="text-sm font-semibold uppercase tracking-wide text-accent-foreground/70 hover:text-primary"
            >
              Console
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <a
            href={`tel:${SUPPORT_PHONE_TEL}`}
            className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold sm:flex"
          >
            <Phone className="size-4 text-primary" /> Call us
          </a>
          <Link to="/wishlist" aria-label="Wishlist">
            <Button variant="ghost" size="icon">
              <Heart className="size-5" />
            </Button>
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="size-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-5" />
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gap-2">
                <UserRound className="size-4" /> Sign in
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-semibold uppercase tracking-wide"
              >
                {item.label}
              </Link>
            ))}
            {isStaff && (
              <Link to="/staff" onClick={() => setOpen(false)} className="py-2.5 text-sm font-semibold uppercase">
                Console
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
