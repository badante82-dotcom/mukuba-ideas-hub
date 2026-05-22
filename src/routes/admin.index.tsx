import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Overview" }] }),
  component: Overview,
});

const COLORS = ["#10b981", "#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#64748b"];

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data: all } = await supabase.from("suggestions").select("id,status,category,created_at,resolved_at");
      const items = all ?? [];
      const total = items.length;
      const resolved = items.filter((s) => s.status === "resolved").length;
      const pending = items.filter((s) => s.status === "submitted" || s.status === "under_review").length;
      const urgent = items.filter((s) => s.status === "in_progress").length;

      const byCategory = Object.entries(
        items.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.category]: (acc[s.category] ?? 0) + 1 }), {})
      ).map(([name, value]) => ({ name, value }));

      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        return { day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          count: items.filter((s) => s.created_at.slice(0, 10) === key).length };
      });

      return { total, resolved, pending, urgent, byCategory, days };
    },
  });

  const metrics = [
    { label: "Total suggestions", value: data?.total ?? 0, icon: MessageSquare },
    { label: "Pending review", value: data?.pending ?? 0, icon: Clock },
    { label: "In progress", value: data?.urgent ?? 0, icon: AlertTriangle },
    { label: "Resolved", value: data?.resolved ?? 0, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Overview</h1>
        <p className="mt-1 text-muted-foreground">Real-time pulse of the suggestion platform.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5">
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
          <div className="font-semibold mb-1">Submissions (last 14 days)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.days ?? []}>
                <XAxis dataKey="day" stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "oklch(0.95 0.01 240 / 0.3)" }} contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.92 0.012 250)", fontSize: 12 }} />
                <Bar dataKey="count" fill="oklch(0.7 0.16 165)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="font-semibold mb-1">By category</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.byCategory ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {(data?.byCategory ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
