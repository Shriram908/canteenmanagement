import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, useCartSummary } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { formatINR, isOutletOpen } from "@/lib/menu-data";
import { ShieldCheck, MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { startTestPayment, verifyTestPayment } from "@/lib/payments.functions";
import { loadRazorpay, type RazorpaySuccess } from "@/lib/razorpay";

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
  const { outletId, items, syncing, syncError, clear } = useCart();
  const { outlets } = useCatalog();
  const outlet = outlets.find((o) => o.id === outletId);
  const start = useServerFn(startTestPayment);
  const verify = useServerFn(verifyTestPayment);
  const client = useQueryClient();
  const attempt = useRef<{ fingerprint: string; key: string } | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState<{ orderId: string; paymentId: string } | undefined>(undefined);
  async function finish(orderId: string, paymentId: string) {
    setBusy(true); setError("");
    try {
      await verify({ data: { orderId, paymentId } });
      setPending(undefined); clear(); setSuccess(true);
      await Promise.all([client.invalidateQueries({ queryKey: ["orders"] }), client.invalidateQueries({ queryKey: ["catalog"] })]);
    } catch (failure) { setPending({ orderId, paymentId }); setError(failure instanceof Error ? failure.message : "Payment verification failed. Do not pay again."); }
    finally { setBusy(false); }
  }
  async function pay() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await loadRazorpay();
      const fingerprint = JSON.stringify({ outletId, items, total: q.total });
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      const current = attempt.current;
      if (!current) return;
      const payment = await start({ data: { cart: { outletId, items }, expectedTotal: q.total, idempotencyKey: current.key, notes: "" } });
      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("Razorpay could not load.");
      const checkout = new Razorpay({ key: payment.keyId, order_id: payment.providerOrderId, amount: payment.amount, currency: "INR", name: "Food Book", description: "Campus pickup · Test payment", handler: (result: RazorpaySuccess) => { void finish(payment.orderId, result.razorpay_payment_id); }, modal: { ondismiss: () => { setBusy(false); setError("Payment was not completed. Your cart is unchanged."); } } });
      checkout.on("payment.failed", () => { setBusy(false); setError("Test payment failed. Retry or check your orders."); });
      checkout.open();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Payment could not start."); setBusy(false); }
  }
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Checkout</h1>
      {success ? <div className="mt-6"><p role="status" className="font-semibold text-veg">Test payment verified. Your pickup order is confirmed.</p><Button asChild className="mt-4"><Link to="/orders">View your order</Link></Button></div> : syncing ? (
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
            <Button disabled={busy || !!syncError || (!pending && (!outlet?.acceptingOrders || !isOutletOpen(outlet) || lines.some(({dish}) => !dish.available)))} onClick={() => pending ? void finish(pending.orderId, pending.paymentId) : void pay()} className="mt-5 min-h-12 w-full">
              <ShieldCheck />
              {busy ? "Processing…" : pending ? "Recheck payment" : `Pay ${formatINR(q.total)} · Test`}
            </Button>
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Razorpay test mode only. No real money is charged. Counter payments are not accepted.
            </p>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          </aside>
        </div>
      )}
    </AppShell>
  );
}
