import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Download, Clock } from "lucide-react";
import { getStaffOrders, updateOrder } from "@/lib/staff.functions";
import { formatINR } from "@/lib/menu-data";
import { canTransition, canCancel } from "@/lib/order-rules";
import { Button } from "./ui/button";
import type { z } from "zod";
import type { orderActionInput } from "@/lib/order-rules";
import { SalesSummary } from "./SalesSummary";
import { useOrderRealtime } from "@/hooks/use-order-realtime";

export function StaffOrders({ outlet, active }: { outlet: "main" | "hostel"; active: boolean }) {
  useOrderRealtime(outlet);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const read = useServerFn(getStaffOrders);
  const write = useServerFn(updateOrder);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["staff-orders", outlet, active, page],
    queryFn: () => read({ data: { outlet, active, page } }),
    refetchInterval: 10000,
  });
  async function action(id: string, action: z.infer<typeof orderActionInput>["action"]) {
    if (
      (action === "cancelled" || action === "completed") &&
      !confirm(
        action === "cancelled"
          ? "Cancel this order and return its stock?"
          : "Confirm this order has been collected?",
      )
    )
      return;
    setBusy(id);
    setError("");
    try {
      await write({ data: { id, action } });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["staff-orders"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["catalog"] }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The order could not be updated.");
    } finally {
      setBusy("");
    }
  }
  const orders = query.data?.orders ?? [];
  function download() {
    const cell = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const csv = [
      "Order,Created IST,Status,Payment,Total INR",
      ...orders.map((o) =>
        [
          o.id,
          new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          o.status,
          o.payment_status,
          (o.total_paise / 100).toFixed(2),
        ]
          .map(cell)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `food-book-${outlet}-page-${page + 1}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section>
      {!active && <SalesSummary outlet={outlet} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {query.data?.count ?? 0} {active ? "active orders" : "orders"}
        </p>
        <div className="flex gap-2">
          {!active && (
            <Button variant="outline" onClick={download} disabled={!orders.length}>
              <Download />
              Export page
            </Button>
          )}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw />
            Refresh
          </Button>
        </div>
      </div>
      {(error || query.error) && (
        <p role="alert" className="mb-4 text-destructive">
          {error || query.error?.message}
        </p>
      )}
      {query.isPending ? (
        <p role="status">Loading orders…</p>
      ) : !orders.length ? (
        <div className="border-y py-16 text-center">
          <ChefEmpty />
          <p className="mt-3 font-semibold">
            {active ? "The kitchen queue is clear" : "No orders yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <article key={o.id} className="rounded-lg border bg-card p-5">
              <div className="flex justify-between gap-2">
                <h2 className="font-semibold">#{o.id.slice(0, 8)}</h2>
                <span className="font-semibold capitalize text-primary">
                  {o.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </p>
              <ul className="my-4 space-y-2">
                {o.order_items.map((i) => (
                  <li key={i.id} className="flex gap-2">
                    <span className="font-bold">{i.quantity}×</span>
                    {i.dish_name}
                  </li>
                ))}
              </ul>
              {o.notes && <p className="mb-3 border-l-2 border-primary pl-3 text-sm">{o.notes}</p>}
              <div className="flex justify-between border-t pt-3 text-sm">
                <span className="capitalize">Payment: {o.payment_status}</span>
                <strong>{formatINR(o.total_paise)}</strong>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    ["preparing", "Start preparing"],
                    ["ready", "Mark ready"],
                    ["completed", "Mark collected"],
                  ] as const
                )
                  .filter(([s]) => canTransition(o.status, s, o.payment_status))
                  .map(([s, label]) => (
                    <Button key={s} disabled={busy === o.id} onClick={() => void action(o.id, s)}>
                      {label}
                    </Button>
                  ))}
                {canCancel(o.status, o.payment_status) && (
                  <Button
                    variant="outline"
                    disabled={busy === o.id}
                    onClick={() => void action(o.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <details className="mt-4 text-xs text-muted-foreground">
                <summary className="cursor-pointer">Order activity</summary>
                <ul className="mt-2 space-y-1">
                  {[...o.order_events]
                    .sort((a, b) => a.created_at.localeCompare(b.created_at))
                    .map((e) => (
                      <li key={e.id}>
                        {e.event} ·{" "}
                        {new Date(e.created_at).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </li>
                    ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      )}
      {(page > 0 || (query.data?.count ?? 0) > 30) && (
        <div className="mt-5 flex items-center justify-between">
          <Button variant="outline" disabled={!page} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm">Page {page + 1}</span>
          <Button
            variant="outline"
            disabled={(page + 1) * 30 >= (query.data?.count ?? 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
function ChefEmpty() {
  return <Clock className="mx-auto h-8 w-8 text-muted-foreground" />;
}
