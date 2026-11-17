import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSalesSummary } from "@/lib/staff.functions";
import { formatINR } from "@/lib/menu-data";
import { Button } from "./ui/button";

export function SalesSummary({ outlet }: { outlet: "main" | "hostel" }) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [range, setRange] = useState({ from: today, to: today });
  const fetch = useServerFn(getSalesSummary);
  const start = new Date(`${range.from}T00:00:00+05:30`);
  const end = new Date(new Date(`${range.to}T00:00:00+05:30`).getTime() + 86400000);
  const query = useQuery({
    queryKey: ["sales", outlet, range],
    queryFn: () => fetch({ data: { outlet, from: start.toISOString(), to: end.toISOString() } }),
  });
  return (
    <section className="mb-8 border-b pb-6">
      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setRange({ from, to });
        }}
      >
        <label className="text-sm">
          From (IST)
          <input
            required
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block min-h-11 rounded-md border bg-card px-3"
          />
        </label>
        <label className="text-sm">
          Through (IST)
          <input
            required
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block min-h-11 rounded-md border bg-card px-3"
          />
        </label>
        <Button type="submit" disabled={query.isFetching}>
          Show totals
        </Button>
      </form>
      {query.error && (
        <p role="alert" className="text-destructive">
          {query.error.message}
        </p>
      )}
      {query.data && (
        <dl className="grid grid-cols-2 gap-5 md:grid-cols-5">
          {[
            ["Orders", query.data.orders],
            ["Paid orders", query.data.paid_orders],
            ["Collected", formatINR(query.data.collected_paise)],
            ["Cancelled", query.data.cancelled],
            ["Refunded", formatINR(query.data.refunded_paise)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
