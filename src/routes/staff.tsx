import { createFileRoute, redirect, Link, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LayoutDashboard, Inbox, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/staff")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const ok = (roles ?? []).some((r) => ["staff", "stakeholder", "admin", "super_admin"].includes(r.role));
    if (!ok) throw redirect({ to: "/" });
  },
  component: StaffShell,
});

function StaffShell() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-navy text-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Logo tone="light" />
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {[
                { to: "/staff", label: "Dashboard", icon: LayoutDashboard, exact: true },
                { to: "/app/my-suggestions", label: "My items", icon: Inbox },
                { to: "/app/submit", label: "Submit", icon: Send },
                { to: "/transparency", label: "Resolved", icon: CheckCircle2 },
              ].map((n) => (
                <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white/70 hover:bg-white/5 hover:text-white" activeProps={{ className: "bg-white/10 text-white" }}>
                  <n.icon className="h-3.5 w-3.5" />{n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} className="text-white hover:bg-white/10 hover:text-white">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/"><Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">Exit</Button></Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8"><Outlet /></main>
    </div>
  );
}
