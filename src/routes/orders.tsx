import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Your orders — Food Book" }, { name: "description", content: "Your orders on Food Book." },
    { property: "og:title", content: "Your orders — Food Book" }, { property: "og:description", content: "Your orders on Food Book." }] }),
  component: () => (
    <AppShell>
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your orders</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">Accounts aren't switched on yet. Once sign-in is added, this page will show your order details.</p>
        <Link to="/menu" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Browse menu</Link>
      </div>
    </AppShell>
  ),
});
