import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell, useCartSummary } from "@/components/AppShell";
import { formatINR } from "@/lib/menu-data";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Food Book" }, { name: "description", content: "Review your canteen order." },
    { property: "og:title", content: "Your cart — Food Book" }, { property: "og:description", content: "Review your canteen order." }] }),
  component: Cart,
});

function Cart() {
  const { setQty } = useCart();
  const { lines, q } = useCartSummary();
  if (!lines.length) return <AppShell><div className="py-16 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1>
    <p className="mt-2 text-muted-foreground">Add something tasty from the menu.</p>
    <Link to="/menu" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Browse menu</Link></div></AppShell>;
  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Your cart</h1>
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_340px]">
        <ul className="divide-y rounded-2xl bg-card shadow-card">
          {lines.map(({ dish, qty }) => (
            <li key={dish.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><p className="font-semibold">{dish.name}</p><p className="text-sm text-muted-foreground">{formatINR(dish.pricePaise)} each</p></div>
              <label className="sr-only" htmlFor={`q-${dish.id}`}>Quantity</label>
              <select id={`q-${dish.id}`} value={qty} onChange={(e) => setQty(dish.id, +e.target.value)} className="min-h-11 rounded-lg border bg-background px-2">
                {Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select>
              <span className="w-16 text-right font-semibold">{formatINR(dish.pricePaise * qty)}</span>
              <button onClick={() => setQty(dish.id, 0)} aria-label={`Remove ${dish.name}`} className="grid h-11 w-11 place-items-center text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
            </li>))}
        </ul>
        <aside className="h-fit rounded-2xl bg-card p-5 shadow-card">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(q.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Packaging</dt><dd>{formatINR(q.packaging)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Taxes</dt><dd>Set by the canteen</dd></div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Estimated total</dt><dd>{formatINR(q.total)}</dd></div>
          </dl>
          <button disabled className="mt-5 min-h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground opacity-60">Checkout — coming soon</button>
          <p className="mt-2 text-xs text-muted-foreground">Sign-in and Razorpay payments are the next step. They need the online database and your Razorpay test keys first.</p>
        </aside>
      </div>
    </AppShell>
  );
}
