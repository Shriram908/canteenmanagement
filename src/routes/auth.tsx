import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: "forgot" } => search["mode"] === "forgot" ? { mode: "forgot" } : {},
  head: () => ({ meta: [
    { title: "Sign in — Food Book" }, { name: "description", content: "Sign in to save your campus canteen cart and view orders." },
    { property: "og:title", content: "Sign in — Food Book" }, { property: "og:description", content: "Your campus meals and orders in one account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { if (user && mode !== "forgot") void navigate({ to: "/profile", replace: true }); }, [user, mode, navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setMessage("If an account exists for this email, a password reset link is on its way.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } } });
        if (result.error) throw result.error;
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        await navigate({ to: "/profile", replace: true });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in could not be completed."); }
    finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setBusy(true); setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) { setError(result.error.message); return; }
      if (result.redirected) return;
      await navigate({ to: "/profile", replace: true });
    } catch { setError("Sign-in could not be completed. Please try again."); }
    finally { setBusy(false); }
  }
  return <AppShell><section className="mx-auto max-w-sm py-7">
    <h1 className="font-display text-3xl font-bold">{mode === "signup" ? "Join Food Book" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
    <form onSubmit={submit} className="mt-6 space-y-4">
      {mode === "signup" && <label className="block text-sm font-medium">Your name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" className="mt-1 min-h-12 w-full rounded-lg border bg-card px-3" /></label>}
      <label className="block text-sm font-medium">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 min-h-12 w-full rounded-lg border bg-card px-3" /></label>
      {mode !== "forgot" && <label className="block text-sm font-medium">Password<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 min-h-12 w-full rounded-lg border bg-card px-3" /></label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-veg">{message}</p>}
      <Button disabled={busy} type="submit" className="min-h-12 w-full">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    {mode !== "forgot" && <div className="mt-4 space-y-2">
      <Button variant="outline" disabled={busy} className="google-signin min-h-12 w-full" onClick={() => void social("google")}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        Continue with Google
      </Button>
      <Button variant="outline" disabled={busy} className="min-h-12 w-full" onClick={() => void social("lovable")}><LovableMark />Continue with Lovable</Button>
    </div>}
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button variant="link" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setMessage(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "Create an account"}</Button>
      {mode !== "forgot" && <Button variant="link" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}>Forgot password?</Button>}
      {mode === "forgot" && <Button variant="link" onClick={() => setMode("signin")}>Back to sign in</Button>}
    </div>
    <Link to="/menu" className="mt-4 block text-center text-sm text-muted-foreground underline">Continue browsing</Link>
  </section></AppShell>;
}