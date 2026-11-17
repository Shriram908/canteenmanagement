import { Link, useLocation } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Receipt, User, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { outlets, dishes, isOutletOpen, formatINR } from "@/lib/menu-data";
import { useCart } from "@/lib/cart";
import { quote } from "@/lib/pricing";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function useCartSummary() {
  const { items } = useCart();
  const lines = Object.entries(items).flatMap(([id, qty]) => {
    const dish = dishes.find((d) => d.id === id);
    return dish ? [{ dish, qty }] : [];
  });
  return { lines, q: quote(lines.map((l) => ({ pricePaise: l.dish.pricePaise, qty: l.qty }))) };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { outletId, setOutlet, items } = useCart();
  const outlet = outlets.find((o) => o.id === outletId) ?? outlets[0];
  const { user, loading } = useAuth();
  const open = outlet ? isOutletOpen(outlet) : false;
  const { q } = useCartSummary();
  const onCart = useLocation({ select: (l) => l.pathname === "/cart" });
  return (
    <div className="min-h-screen pb-36 md:pb-10">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-bold text-primary">Food Book</Link>
          <nav className="ml-6 hidden gap-1 md:flex">
            {nav.map((n) => <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="rounded-full px-3 py-2 text-sm" activeProps={{ className: "bg-secondary font-semibold" }}>{n.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {!loading && <Link to={user ? "/profile" : "/auth"} aria-label={user ? "Your account" : "Sign in"} className="grid min-h-11 min-w-11 place-items-center rounded-full border bg-card" title={user ? "Your account" : "Sign in"}><User className="h-5 w-5" /></Link>}
            <label className="sr-only" htmlFor="outlet">Outlet</label>
            <select id="outlet" value={outletId} className="min-h-11 max-w-40 rounded-full border bg-card px-3 text-sm"
              onChange={(e) => {
                if (Object.keys(items).length && !confirm("Switching outlet will empty your cart. Continue?")) return;
                setOutlet(e.target.value);
              }}>
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-2 text-xs text-muted-foreground">
          <span className={`font-semibold ${open ? "text-veg" : "text-destructive"}`}>{open ? "● Open now" : "○ Closed"}</span>
          {" "}· {outlet?.location} · {outlet?.opens}–{outlet?.closes} IST
        </p>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      {q.items > 0 && !onCart && (
        <Link to="/cart" className="fixed inset-x-3 bottom-20 z-30 flex min-h-14 items-center justify-between rounded-2xl bg-primary px-5 text-primary-foreground shadow-card md:bottom-6 md:left-auto md:right-6 md:w-80">
          <span className="flex items-center gap-2 font-semibold"><ShoppingBag className="h-5 w-5" />{q.items} item{q.items > 1 ? "s" : ""}</span>
          <span className="font-semibold">{formatINR(q.subtotal)} · View cart</span>
        </Link>
      )}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card md:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground" activeProps={{ className: "text-primary font-semibold" }}>
            <n.icon className="h-5 w-5" aria-hidden />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
