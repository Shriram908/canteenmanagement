import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { DishCard } from "@/components/DishCard";
import { categories, type CategoryId } from "@/lib/menu-data";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";

const ids = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];
export const Route = createFileRoute("/menu")({
  validateSearch: z.object({ category: z.enum(ids).optional() }),
  head: () => ({ meta: [
    { title: "Menu — Food Book" }, { name: "description", content: "Breakfast, thalis, breads, soups, chai and desserts from the campus canteen." },
    { property: "og:title", content: "Menu — Food Book" }, { property: "og:description", content: "Browse today's campus canteen menu." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Menu,
});

function Menu() {
  const { dishes } = useCatalog();
  const { category } = Route.useSearch();
  const nav = useNavigate({ from: "/menu" });
  const { outletId } = useCart();
  const [q, setQ] = useState(""); const [diet, setDiet] = useState<"all" | "veg" | "vegan">("all");
  const [sort, setSort] = useState("default"); const [onlyAvail, setOnlyAvail] = useState(false);
  let list = dishes.filter((d) => d.outletId === outletId
    && (!category || d.category === category)
    && (diet === "all" || (diet === "vegan" ? d.diet === "vegan" : d.diet === "veg" || d.diet === "vegan"))
    && (!onlyAvail || d.available)
    && (d.name + d.description).toLowerCase().includes(q.toLowerCase()));
  if (sort !== "default") list = [...list].sort((a, b) => sort === "asc" ? a.pricePaise - b.pricePaise : b.pricePaise - a.pricePaise);
  const chip = (active: boolean) => `min-h-10 shrink-0 rounded-full border px-4 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`;
  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Menu</h1>
      <label className="relative mt-3 block">
        <span className="sr-only">Search dishes</span>
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dosa, chai, biryani…" className="min-h-12 w-full rounded-full border bg-card pl-11 pr-4" />
      </label>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Category">
        <button className={chip(!category)} aria-pressed={!category} onClick={() => nav({ search: {} })}>All</button>
        {categories.map((c) => <button key={c.id} className={chip(category === c.id)} aria-pressed={category === c.id} onClick={() => nav({ search: { category: c.id } })}>{c.label}</button>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <select aria-label="Dietary filter" value={diet} onChange={(e) => setDiet(e.target.value as typeof diet)} className="min-h-10 rounded-full border bg-card px-3"><option value="all">All diets</option><option value="veg">Vegetarian</option><option value="vegan">Vegan</option></select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-10 rounded-full border bg-card px-3"><option value="default">Recommended</option><option value="asc">Price: low to high</option><option value="desc">Price: high to low</option></select>
        <label className="flex min-h-10 items-center gap-2 px-2"><input type="checkbox" checked={onlyAvail} onChange={(e) => setOnlyAvail(e.target.checked)} className="h-4 w-4 accent-primary" />Available only</label>
      </div>
      {list.length === 0 ? (
        <div className="mt-10 text-center text-muted-foreground"><p>No dishes match these filters.</p>
          <button className="mt-3 font-semibold text-primary underline" onClick={() => { setQ(""); setDiet("all"); setOnlyAvail(false); nav({ search: {} }); }}>Clear filters</button></div>
      ) : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((d) => <DishCard key={d.id} dish={d} />)}</div>}
    </AppShell>
  );
}
