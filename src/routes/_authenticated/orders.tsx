import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getCustomerOrders } from "@/lib/customer.functions";
import { formatINR, outlets } from "@/lib/menu-data";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [
    { title: "Your orders — Food Book" }, { name: "description", content: "Track your Food Book pickup orders and payment status." },
    { property: "og:title", content: "Your orders — Food Book" }, { property: "og:description", content: "Your campus canteen order history." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["orders", 0], queryFn: () => getCustomerOrders({ data: { page: 0 } }) }),
  component: Orders,
});
function Orders() {
  const [page, setPage] = useState(0);
  const fetchOrders = useServerFn(getCustomerOrders);
  const { data, refetch, isFetching } = useSuspenseQuery({ queryKey: ["orders", page], queryFn: () => fetchOrders({ data: { page } }) });
  return <AppShell><div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Your orders</h1><Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Refresh</Button></div>
    {data.length === 0 ? <div className="py-14 text-center"><p className="text-muted-foreground">{page ? "No more orders." : "You haven't placed any orders yet."}</p><Button asChild className="mt-5 min-h-12"><Link to="/menu">Browse menu</Link></Button></div> : <ul className="mt-5 grid gap-4 md:grid-cols-2">
      {data.map((order) => <li key={order.id} className="rounded-lg border bg-card p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{outlets.find((o) => o.id === order.outlet_id)?.name}</h2><span className="font-semibold">{formatINR(order.total_paise)}</span></div>
        <p className="mt-1 text-xs text-muted-foreground">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST</p>
        <ul className="my-4 space-y-1 text-sm">{order.order_items.map((item, index) => <li key={index}>{item.quantity} × {item.dish_name}</li>)}</ul>
        <div className="flex flex-wrap gap-3 border-t pt-3 text-sm"><span className="font-semibold capitalize">{order.status.replaceAll("_", " ")}</span><span className="capitalize text-muted-foreground">Payment: {order.payment_status}</span></div>
      </li>)}
    </ul>}
    {(page > 0 || data.length === 20) && <div className="mt-5 flex justify-between"><Button variant="outline" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>Previous</Button><Button variant="outline" disabled={data.length < 20} onClick={() => setPage((n) => n + 1)}>Next</Button></div>}
  </AppShell>;
}