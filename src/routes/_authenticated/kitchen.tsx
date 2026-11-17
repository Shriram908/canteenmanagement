import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getStaffAccess } from "@/lib/staff.functions";
import { useCatalog } from "@/lib/catalog";
import { StaffShell, AccessDenied } from "@/components/StaffShell";
import { StaffOrders } from "@/components/StaffOrders";

export const Route = createFileRoute("/_authenticated/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen queue — Food Book" },
      { name: "description", content: "Food Book staff order preparation and pickup queue." },
      { property: "og:title", content: "Kitchen queue — Food Book" },
      { property: "og:description", content: "Campus canteen kitchen operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["staff-access"],
      queryFn: () => getStaffAccess(),
    }),
  component: Kitchen,
});
function Kitchen() {
  const { data } = useSuspenseQuery({
    queryKey: ["staff-access"],
    queryFn: () => getStaffAccess(),
  });
  const { outlets } = useCatalog();
  const [outlet, setOutlet] = useState<"main" | "hostel">("main");
  if (!data.kitchen) return <AccessDenied />;
  return (
    <StaffShell admin={data.admin}>
      <div className="mb-6 flex flex-wrap justify-between gap-3">
        <h1 className="text-3xl font-bold">Kitchen queue</h1>
        <select
          aria-label="Kitchen outlet"
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
      <StaffOrders key={outlet} outlet={outlet} active />
    </StaffShell>
  );
}
