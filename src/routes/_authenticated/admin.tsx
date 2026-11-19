import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getStaffAccess } from "@/lib/staff.functions";
import { catalogOptions } from "@/lib/catalog";
import { stockStatus } from "@/lib/admin-rules";
import { StaffShell, AccessDenied } from "@/components/StaffShell";
import { StaffOrders } from "@/components/StaffOrders";
import { CatalogEditor, OutletEditor } from "@/components/CatalogEditor";
import { Button } from "@/components/ui/button";
import { Utensils, Receipt, Settings2, RefreshCw, CircleCheck, CirclePause } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Food Book" },
      { name: "description", content: "Manage Food Book menu, inventory, outlets and orders." },
      { property: "og:title", content: "Administration — Food Book" },
      { property: "og:description", content: "Campus canteen administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["staff-access"],
      queryFn: () => getStaffAccess(),
    }),
  component: Admin,
});
function Admin() {
  const { data } = useSuspenseQuery({
    queryKey: ["staff-access"],
    queryFn: () => getStaffAccess(),
  });
  const { data: catalog, isFetching } = useSuspenseQuery(catalogOptions);
  const client = useQueryClient();
  const [outlet, setOutlet] = useState<"main" | "hostel">("main");
  if (!data.admin) return <AccessDenied />;
  const menu = catalog.dishes.filter((d) => d.outlet_id === outlet);
  const selected = catalog.outlets.find((o) => o.id === outlet);
  return (
    <StaffShell admin>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Canteen operations</p>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="mt-2 text-sm text-muted-foreground">{selected?.location}</p>
        </div>
        <div className="flex max-w-full items-center gap-2">
        <select
          aria-label="Administration outlet"
          value={outlet}
          onChange={(e) => setOutlet(e.target.value === "hostel" ? "hostel" : "main")}
          className="min-h-11 rounded-md border bg-card px-3"
        >
          {catalog.outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
          <Button variant="outline" size="icon" aria-label="Refresh administration" title="Refresh administration" disabled={isFetching} onClick={() => void client.invalidateQueries({ queryKey: ["catalog"] })}>
            <RefreshCw className={isFetching ? "motion-safe:animate-spin" : ""} />
          </Button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-xs">
        <span className={selected?.accepting_orders ? "flex items-center gap-1.5 text-veg" : "flex items-center gap-1.5 text-muted-foreground"}>
          {selected?.accepting_orders ? <CircleCheck className="size-4" /> : <CirclePause className="size-4" />}
          {selected?.accepting_orders ? "Orders enabled" : "Orders paused"}
        </span>
        <span className="text-muted-foreground">{selected?.opens}–{selected?.closes} IST</span>
        <span className="text-primary">Razorpay · Test mode</span>
      </div>
      <dl className="my-6 grid grid-cols-2 gap-5 border-y py-5 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Menu dishes</dt>
          <dd className="mt-1 text-2xl font-bold">{menu.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Available</dt>
          <dd className="mt-1 text-2xl font-bold text-veg">
            {menu.filter((d) => stockStatus(d) === "available").length}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sold out</dt>
          <dd className="mt-1 text-2xl font-bold">{menu.filter((d) => stockStatus(d) === "sold-out").length}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Unlisted</dt>
          <dd className="mt-1 text-2xl font-bold">{menu.filter((d) => stockStatus(d) === "unlisted").length}</dd>
        </div>
      </dl>
      <Tabs defaultValue="menu" key={outlet}>
      <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto rounded-md" aria-label="Administration sections">
        {(
          [
            { id: "menu", label: "Menu & stock", icon: Utensils },
            { id: "orders", label: "Orders", icon: Receipt },
            { id: "settings", label: "Outlet settings", icon: Settings2 },
          ] as const
        ).map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="min-h-11 gap-2 px-3"
          >
            <t.icon className="size-4" />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="menu"><CatalogEditor outlet={outlet} /></TabsContent>
      <TabsContent value="orders"><StaffOrders outlet={outlet} active={false} /></TabsContent>
      <TabsContent value="settings"><OutletEditor outlet={outlet} /></TabsContent>
      </Tabs>
    </StaffShell>
  );
}
