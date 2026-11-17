import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Your profile — Food Book" }, { name: "description", content: "Your profile on Food Book." },
    { property: "og:title", content: "Your profile — Food Book" }, { property: "og:description", content: "Your profile on Food Book." }] }),
  component: () => (
    <AppShell>
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">Accounts aren't switched on yet. Once sign-in is added, this page will show your profile.</p>
        <Link to="/menu" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Browse menu</Link>
      </div>
    </AppShell>
  ),
});
