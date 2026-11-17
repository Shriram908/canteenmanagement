import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getStaffAccess } from "@/lib/staff.functions";
import { useCatalog } from "@/lib/catalog";
import { StaffShell, AccessDenied } from "@/components/StaffShell";
import { StaffOrders } from "@/components/StaffOrders";
import { CatalogEditor, OutletEditor } from "@/components/CatalogEditor";
import { Button } from "@/components/ui/button";
import { Utensils, Receipt, Settings2 } from "lucide-react";

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
  const { outlets, dishes } = useCatalog();
  const [outlet, setOutlet] = useState<"main" | "hostel">("main");
  const [tab, setTab] = useState<"menu" | "orders" | "settings">("menu");
  if (!data.admin) return <AccessDenied />;
  const menu = dishes.filter((d) => d.outletId === outlet);
  return (
    <StaffShell admin>
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-3xl font-bold">Administration</h1>
        <select
          aria-label="Administration outlet"
          value={outlet}
          onChange={(e) => setOutlet(e.target.value === "hostel" ? "hostel" : "main")}
          className="min-h-11 rounded-md border bg-card px-3"
        >
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <dl className="my-6 grid grid-cols-3 border-y py-5">
        <div>
          <dt className="text-xs text-muted-foreground">Menu dishes</dt>
          <dd className="mt-1 text-2xl font-bold">{menu.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Available</dt>
          <dd className="mt-1 text-2xl font-bold text-veg">
            {menu.filter((d) => d.available).length}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sold out</dt>
          <dd className="mt-1 text-2xl font-bold">{menu.filter((d) => !d.available).length}</dd>
        </div>
      </dl>
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Administration sections"
      >
        {(
          [
            { id: "menu", label: "Menu & stock", icon: Utensils },
            { id: "orders", label: "Orders", icon: Receipt },
            { id: "settings", label: "Outlet settings", icon: Settings2 },
          ] as const
        ).map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            <t.icon />
            {t.label}
          </Button>
        ))}
      </div>
      <div role="tabpanel" key={`${outlet}-${tab}`}>
        {tab === "menu" ? (
          <CatalogEditor outlet={outlet} />
        ) : tab === "orders" ? (
          <StaffOrders outlet={outlet} active={false} />
        ) : (
          <OutletEditor outlet={outlet} />
        )}
      </div>
    </StaffShell>
  );
}
