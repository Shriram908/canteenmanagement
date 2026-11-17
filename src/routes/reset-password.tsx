import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — Food Book" }, { name: "description", content: "Set a new password for your Food Book account." },
    { property: "og:title", content: "Reset password — Food Book" }, { property: "og:description", content: "Recover access to your Food Book account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ResetPassword,
});
function ResetPassword() {
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => { setValid(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    const { error: failure } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (failure) setError(failure.message); else setDone(true);
  }
  return <AppShell><section className="mx-auto max-w-sm py-8"><h1 className="text-2xl font-bold">Reset your password</h1>
    {done ? <><p role="status" className="mt-4">Your password has been updated.</p><Link to="/profile" className="mt-4 block text-primary underline">Your account</Link></> : valid ? <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block text-sm">New password<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border bg-card px-3" /></label>
      <label className="block text-sm">Confirm password<input required type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 min-h-12 w-full rounded-lg border bg-card px-3" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy} className="min-h-12 w-full">{busy ? "Saving…" : "Set new password"}</Button>
    </form> : <><p className="mt-4 text-muted-foreground">Open the password reset link from your email. If it expired, request a new one.</p><Link to="/auth" className="mt-4 block text-primary underline">Request a reset link</Link></>}
  </section></AppShell>;
}