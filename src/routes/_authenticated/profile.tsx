import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getCustomer, updateCustomer } from "@/lib/customer.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
    { title: "Your profile — Food Book" }, { name: "description", content: "Manage your Food Book account and customer name." },
    { property: "og:title", content: "Your profile — Food Book" }, { property: "og:description", content: "Your campus canteen account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["customer"], queryFn: () => getCustomer() }),
  component: Profile,
});
function Profile() {
  const { user } = useAuth();
  const { data } = useSuspenseQuery({ queryKey: ["customer"], queryFn: useServerFn(getCustomer) });
  const [name, setName] = useState(data.display_name);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const update = useMutation({ mutationFn: useServerFn(updateCustomer), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer"] }) });
  async function signOut() {
    setSigningOut(true); setSignOutError("");
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setSignOutError(error.message); setSigningOut(false); return; }
    await navigate({ to: "/auth", replace: true });
  }
  function submit(event: FormEvent) { event.preventDefault(); update.mutate({ data: { displayName: name } }); }
  return <AppShell><section className="mx-auto max-w-md py-6"><h1 className="font-display text-3xl font-bold">Your profile</h1>
    <p className="mt-2 break-all text-muted-foreground">{user?.email}</p>
    <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-medium">Your name<input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border bg-card px-3" /></label>
      <Button disabled={update.isPending} type="submit" className="min-h-12">{update.isPending ? "Saving…" : "Save name"}</Button>
      {update.isSuccess && <p role="status" className="text-sm text-veg">Your name is saved.</p>}{update.error && <p role="alert" className="text-sm text-destructive">{update.error.message}</p>}
    </form>
    <div className="mt-8 flex flex-wrap gap-3 border-t pt-5"><Button asChild variant="outline" className="min-h-12"><Link to="/orders">Your orders</Link></Button><Button disabled={signingOut} onClick={() => void signOut()} variant="outline" className="min-h-12">{signingOut ? "Signing out…" : "Sign out"}</Button></div>
    {signOutError && <p role="alert" className="mt-3 text-sm text-destructive">{signOutError}</p>}
  </section></AppShell>;
}