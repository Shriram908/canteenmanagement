import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DishCard } from "@/components/DishCard";
import { categories } from "@/lib/menu-data";
import { useCatalog } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import hero from "@/assets/main.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Food Book — Campus canteen ordering" },
    { name: "description", content: "Order from your campus canteen and skip the queue. Pick up hot food when it's ready." },
    { property: "og:title", content: "Food Book — Campus canteen ordering" },
    { property: "og:description", content: "Order ahead from your campus canteen and pick up when ready." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

function Home() {
  const { dishes } = useCatalog();
  const { outletId } = useCart();
  const popular = dishes.filter((d) => d.outletId === outletId && d.popular && d.available);
  return (
    <AppShell>
      <section className="grid items-center gap-6 overflow-hidden rounded-3xl bg-card shadow-card md:grid-cols-2">
        <div className="p-6 md:p-10">
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">Skip the queue.<br />Your meal, ready when you are.</h1>
          <p className="mt-3 text-muted-foreground">Order from the campus canteen and pick up at the counter.</p>
          <Link to="/menu" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Browse the menu</Link>
        </div>
        <img src={hero} alt="A vegetarian thali with dal, paneer, rice and chapatis" width={1024} height={768} className="aspect-[4/3] h-full w-full object-cover" />
      </section>
      <h2 className="mt-8 text-xl font-semibold">Categories</h2>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4">
        {categories.map((c) => (
          <Link key={c.id} to="/menu" search={{ category: c.id }} className="w-28 shrink-0 text-center text-sm font-medium">
            <img src={c.image} alt="" loading="lazy" width={1024} height={768} className="mb-1.5 aspect-square w-28 rounded-2xl object-cover" />{c.label}
          </Link>
        ))}
      </div>
      <h2 className="mt-8 text-xl font-semibold">Popular today</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{popular.map((d) => <DishCard key={d.id} dish={d} />)}</div>
    </AppShell>
  );
}
