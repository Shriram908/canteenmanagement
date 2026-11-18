import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell, useCartSummary } from "@/components/AppShell";
import { formatINR } from "@/lib/menu-data";
import { dishImage } from "@/lib/meal-images";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Food Book" }, { name: "description", content: "Review your canteen order." },
    { property: "og:title", content: "Your cart — Food Book" }, { property: "og:description", content: "Review your canteen order." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Cart,
});

function Cart() {
  const { setQty, syncError, syncing } = useCart();
  const { user } = useAuth();
  const { lines, q } = useCartSummary();
  if (syncing) return <AppShell><h1 className="text-2xl font-bold">Your cart</h1><p role="status" className="mt-4 text-muted-foreground">Loading your saved cart…</p></AppShell>;
  if (!lines.length) return <AppShell><div className="py-16 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1>
    {syncError && <p role="alert" className="mt-2 text-sm text-destructive">{syncError}</p>}
    <p className="mt-2 text-muted-foreground">Add something tasty from the menu.</p>
    <Link to="/menu" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Browse menu</Link></div></AppShell>;
  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Your cart</h1>
      {syncing && <p role="status" className="mt-2 text-sm text-muted-foreground">Loading your saved cart…</p>}
      {syncError && <p role="alert" className="mt-2 text-sm text-destructive">{syncError}</p>}
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_340px]">
        <ul className="h-fit divide-y rounded-2xl bg-card shadow-card">
          {lines.map(({ dish, qty }) => (
            <li key={dish.id} className="flex items-center gap-3 p-4">
              {dishImage(dish.name) && <img src={dishImage(dish.name)} alt={dish.name} width={512} height={512} loading="lazy" className="hidden h-16 w-16 shrink-0 rounded-lg object-cover sm:block" />}
              <div className="min-w-0 flex-1"><p className="font-semibold">{dish.name}</p><p className="text-sm text-muted-foreground">{formatINR(dish.pricePaise)} each</p></div>
              <label className="sr-only" htmlFor={`q-${dish.id}`}>Quantity</label>
              <select id={`q-${dish.id}`} value={qty} onChange={(e) => setQty(dish.id, +e.target.value)} className="min-h-11 rounded-lg border bg-background px-2">
                {Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select>
              <span className="w-16 text-right font-semibold">{formatINR(dish.pricePaise * qty)}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty(dish.id, 0)} aria-label={`Remove ${dish.name}`}><Trash2 className="h-4 w-4" /></Button>
            </li>))}
        </ul>
        <aside className="h-fit rounded-2xl bg-card p-5 shadow-card">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(q.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Packaging</dt><dd>{formatINR(q.packaging)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Taxes</dt><dd>{formatINR(q.tax)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Estimated total</dt><dd>{formatINR(q.total)}</dd></div>
          </dl>
          {user ? <Button asChild className="mt-5 min-h-12 w-full"><Link to="/checkout">Review checkout</Link></Button> : <Button asChild className="mt-5 min-h-12 w-full"><Link to="/auth">Sign in to checkout</Link></Button>}
          <p className="mt-2 text-xs text-muted-foreground">Razorpay test payments only. No real money is charged.</p>
        </aside>
      </div>
    </AppShell>
  );
}
