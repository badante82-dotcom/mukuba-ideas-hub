import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle2, Clock, Send, ArrowRight, Inbox } from "lucide-react";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [{ title: "Staff — Dashboard" }] }),
  component: StaffDashboard,
});

function StaffDashboard() {
  const { user } = useAuth();

  const { data } = useQuery({

    queryKey: ["staff-overview", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [mine, resolved, recent, pending, inProgress] = await Promise.all([
        supabase.from("suggestions").select("id,status").eq("author_id", user!.id),
        supabase.from("suggestions").select("id", { count: "exact", head: true }).eq("status", "resolved").eq("is_public", true),
        supabase.from("suggestions").select("id,title,category,resolved_at").eq("status", "resolved").eq("is_public", true).order("resolved_at", { ascending: false }).limit(5),
        supabase.from("suggestions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("suggestions").select("id", { count: "exact", head: true }).in("status", ["under_review","in_progress"]),
      ]);
      const items = mine.data ?? [];
      return {
        mineTotal: items.length,
        minePending: items.filter((s) => s.status !== "resolved").length,
        mineResolved: items.filter((s) => s.status === "resolved").length,
        resolvedTotal: resolved.count ?? 0,
        awaiting: pending.count ?? 0,
        active: inProgress.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  const metrics = [
    { label: "Awaiting triage", value: data?.awaiting ?? 0, icon: Clock },
    { label: "In progress", value: data?.active ?? 0, icon: MessageSquare },
    { label: "Campus-wide resolved", value: data?.resolvedTotal ?? 0, icon: CheckCircle2 },
    { label: "My submissions", value: data?.mineTotal ?? 0, icon: MessageSquare },
  ];


  return (
    <div className="space-y-8 fade-up">
      <div>
        <h1 className="font-serif text-4xl">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.</h1>
        <p className="mt-1 text-muted-foreground">Your staff workspace — track contributions and review published outcomes.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5 hover-lift fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</div>
              <m.icon className="h-4 w-4 text-emerald" />
            </div>
            <div className="mt-3 font-serif text-4xl">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Recently resolved</h2>
            <Link to="/transparency" className="text-sm text-emerald hover:underline">View all</Link>
          </div>
          {!data?.recent.length ? (
            <p className="text-sm text-muted-foreground">No resolved items yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-emerald font-semibold">{s.category}</div>
                    <div className="font-medium">{s.title}</div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {s.resolved_at ? new Date(s.resolved_at).toLocaleDateString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-navy text-white p-6 flex flex-col">
          <h3 className="font-serif text-2xl">Quick actions</h3>
          <p className="mt-1 text-sm text-white/70">Tools you reach for every day.</p>
          <div className="mt-5 space-y-2">
            <Link to="/app/submit"><Button className="w-full justify-between rounded-full">Submit a suggestion <Send className="h-4 w-4" /></Button></Link>
            <Link to="/app/my-suggestions"><Button variant="outline" className="w-full justify-between rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">My suggestions <Inbox className="h-4 w-4" /></Button></Link>
            <Link to="/transparency"><Button variant="outline" className="w-full justify-between rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">Resolved feed <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
