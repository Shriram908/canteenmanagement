import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, useCartSummary } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatINR, isOutletOpen } from "@/lib/menu-data";
import { ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Food Book" },
      { name: "description", content: "Review your campus pickup and online payment." },
      { property: "og:title", content: "Checkout — Food Book" },
      { property: "og:description", content: "Secure campus canteen checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});
function Checkout() {
  const { lines, q } = useCartSummary();
  const { outletId, syncing, syncError } = useCart();
  const { outlets } = useCatalog();
  const outlet = outlets.find((o) => o.id === outletId);
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Checkout</h1>
      {syncing ? (
        <p role="status" className="mt-4">
          Loading your saved cart…
        </p>
      ) : !lines.length ? (
        <div className="mt-6">
          <p>Your cart is empty.</p>
          <Button asChild className="mt-4">
            <Link to="/menu">Browse menu</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 md:grid-cols-[1fr_340px]">
          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <MapPin />
              Campus pickup
            </h2>
            <p className="mt-3 font-semibold">{outlet?.name}</p>
            <p className="text-sm text-muted-foreground">{outlet?.location}</p>
            <p className="mt-2 text-sm">
              {outlet?.opens}–{outlet?.closes} IST
            </p>
            {outlet && (!outlet.acceptingOrders || !isOutletOpen(outlet)) && (
              <p className="mt-4 text-destructive">This outlet is currently closed for orders.</p>
            )}
            {syncError && (
              <p role="alert" className="mt-4 text-destructive">
                {syncError}
              </p>
            )}
            <ul className="mt-6 divide-y border-y">
              {lines.map(({ dish, qty }) => (
                <li key={dish.id} className="flex justify-between gap-4 py-4">
                  <div>
                    {qty} × {dish.name}
                    {!dish.available && (
                      <p className="text-xs text-destructive">Sold out · remove from your cart</p>
                    )}
                  </div>
                  <span>{formatINR(dish.pricePaise * qty)}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/cart">Edit cart</Link>
            </Button>
          </section>
          <aside className="border-t pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <h2 className="text-xl font-semibold">Payment</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(q.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Packaging</dt>
                <dd>{formatINR(q.packaging)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatINR(q.tax)}</dd>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatINR(q.total)}</dd>
              </div>
            </dl>
            <Button disabled className="mt-5 min-h-12 w-full">
              <ShieldCheck />
              Online payment unavailable
            </Button>
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Razorpay has not been connected. No order or charge will be created. Counter payments
              are not accepted.
            </p>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
