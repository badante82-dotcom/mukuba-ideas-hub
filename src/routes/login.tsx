import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Smart Mukuba Suggestion Box" }, { name: "description", content: "Sign in to submit and track suggestions at Mukuba University." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Signing you in…");
    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !signIn.user) {
      setLoading(false);
      toast.dismiss(toastId);
      return toast.error(error?.message ?? "Sign in failed");
    }
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signIn.user.id);
    const roles = (roleRows ?? []).map((r) => r.role as string);
    setLoading(false);
    toast.dismiss(toastId);
    toast.success("Welcome back");
    if (roles.includes("admin") || roles.includes("super_admin")) {
      navigate({ to: "/admin" });
    } else if (roles.includes("staff") || roles.includes("stakeholder")) {
      navigate({ to: "/staff" });
    } else {
      navigate({ to: "/app/my-suggestions" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your Mukuba account.</p>
          </div>
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">University email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-emerald hover:underline">Forgot?</Link>
              </div>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
            <div className="text-center text-sm text-muted-foreground">
              New here? <Link to="/signup" className="text-emerald hover:underline">Create an account</Link>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
