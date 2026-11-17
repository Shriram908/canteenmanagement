import type { Diet } from "@/lib/menu-data";
const label: Record<Diet, string> = { veg: "Veg", vegan: "Vegan", nonveg: "Non-veg", egg: "Contains egg" };
export function DietBadge({ diet }: { diet: Diet }) {
  const green = diet === "veg" || diet === "vegan";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${green ? "border-veg/40 text-veg" : "border-nonveg/40 text-nonveg"}`}>
      <span aria-hidden className={`grid h-3 w-3 place-items-center border ${green ? "border-veg" : "border-nonveg"}`}>
        <span className={`h-1.5 w-1.5 ${diet === "nonveg" || diet === "egg" ? "rotate-45" : "rounded-full"} ${green ? "bg-veg" : "bg-nonveg"}`} />
      </span>
      {label[diet]}
    </span>
  );
}
