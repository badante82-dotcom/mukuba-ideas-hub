import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getStatusBadgeClass, getSuggestionStatusLabel, STAFF_STATUS_OPTIONS, type SuggestionStatus } from "@/lib/suggestion-status";
import { findSimilarToSuggestion, markAsDuplicate } from "@/lib/suggestions.functions";
import { Sparkles, Loader2 } from "lucide-react";

const STATUSES = STAFF_STATUS_OPTIONS.map((option) => option.value);

type SimilarMatch = { id: string; title: string; status: string; category: string; similarity: number };

export const Route = createFileRoute("/admin/inbox")({
  head: () => ({ meta: [{ title: "Admin — Inbox" }] }),
  component: Inbox,
});

function Inbox() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const setStatus = async (id: string, status: SuggestionStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from("suggestions").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id);
    setUpdatingId(null);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${getSuggestionStatusLabel(status).toLowerCase()}`);
    refetch();
  };

  useEffect(() => {
    const channel = supabase
      .channel("admin-inbox-suggestions")
      .on("postgres_changes", { event: "*", schema: "public", table: "suggestions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const exportCsv = () => {
    const rows = data ?? [];
    const header = ["id","title","category","priority","status","responses","created_at"];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [header.join(","), ...rows.map((r) => [r.id, r.title, r.category, r.priority, r.status, r.responses_count, r.created_at].map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `suggestions-${filter}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="font-serif text-4xl">Inbox</h1>
        <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted">Export CSV</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter("all")} className={`text-xs px-3 py-1.5 rounded-full border ${filter === "all" ? "bg-navy text-white border-navy" : "border-border"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-full border ${filter === s ? "bg-navy text-white border-navy" : "border-border"}`}>{getSuggestionStatusLabel(s)}</button>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(s.status)}`}>{getSuggestionStatusLabel(s.status)}</span>
                    <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
                    <span className="text-xs text-muted-foreground capitalize">• {s.priority}</span>
                  </div>
                  <Link to="/app/suggestions/$id" params={{ id: s.id }} className="font-semibold hover:underline">{s.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                </div>
                <select value={s.status} disabled={updatingId === s.id} onChange={(e) => setStatus(s.id, e.target.value as SuggestionStatus)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs disabled:opacity-60">
                  {STAFF_STATUS_OPTIONS.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
