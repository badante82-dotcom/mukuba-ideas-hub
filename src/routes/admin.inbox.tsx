import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const STATUSES = ["submitted","under_review","in_progress","resolved","rejected"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  under_review: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  resolved: "bg-emerald/10 text-emerald",
  rejected: "bg-destructive/10 text-destructive",
};

export const Route = createFileRoute("/admin/inbox")({
  head: () => ({ meta: [{ title: "Admin — Inbox" }] }),
  component: Inbox,
});

function Inbox() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-inbox", filter],
    queryFn: async () => {
      let q = supabase.from("suggestions").select("id,title,body,category,status,priority,created_at,responses_count").order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: Status) => {
    await supabase.from("suggestions").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
    refetch();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl mb-6">Inbox</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter("all")} className={`text-xs px-3 py-1.5 rounded-full border ${filter === "all" ? "bg-navy text-white border-navy" : "border-border"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-full border capitalize ${filter === s ? "bg-navy text-white border-navy" : "border-border"}`}>{s.replace("_"," ")}</button>
        ))}
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i)=><div key={i} className="h-20 rounded-xl bg-muted animate-pulse"/>)}</div>
      ) : !data?.length ? (
        <div className="text-center py-20 text-muted-foreground">No suggestions match this filter.</div>
      ) : (
        <div className="space-y-3">
          {data.map((s) => (
            <article key={s.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status]}`}>{s.status.replace("_"," ")}</span>
                    <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
                    <span className="text-xs text-muted-foreground capitalize">• {s.priority}</span>
                  </div>
                  <Link to="/app/suggestions/$id" params={{ id: s.id }} className="font-semibold hover:underline">{s.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                </div>
                <select defaultValue={s.status} onChange={(e) => setStatus(s.id, e.target.value as Status)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
                  {STATUSES.map((st) => <option key={st} value={st} className="capitalize">{st.replace("_"," ")}</option>)}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
