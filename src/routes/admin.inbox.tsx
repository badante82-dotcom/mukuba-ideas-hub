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
  const [duplicatesFor, setDuplicatesFor] = useState<{ id: string; title: string } | null>(null);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<SimilarMatch[]>([]);
  const [merging, setMerging] = useState<string | null>(null);
  const findSimilar = useServerFn(findSimilarToSuggestion);
  const markDuplicate = useServerFn(markAsDuplicate);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-inbox", filter],
    queryFn: async () => {
      let q = supabase.from("suggestions").select("id,title,body,category,status,priority,created_at,responses_count,duplicate_of_id").order("created_at", { ascending: false }).limit(100);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const openDuplicates = async (id: string, title: string) => {
    setDuplicatesFor({ id, title });
    setDuplicates([]);
    setDuplicatesLoading(true);
    try {
      const res = await findSimilar({ data: { id } });
      setDuplicates(res.matches);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to find duplicates");
    } finally {
      setDuplicatesLoading(false);
    }
  };

  const mergeInto = async (targetId: string) => {
    if (!duplicatesFor) return;
    setMerging(targetId);
    try {
      await markDuplicate({ data: { id: duplicatesFor.id, duplicateOfId: targetId } });
      toast.success("Marked as duplicate");
      setDuplicatesFor(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to merge");
    } finally {
      setMerging(null);
    }
  };

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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(s.status)}`}>{getSuggestionStatusLabel(s.status)}</span>
                    <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
                    <span className="text-xs text-muted-foreground capitalize">• {s.priority}</span>
                    {s.duplicate_of_id && (
                      <Link to="/app/suggestions/$id" params={{ id: s.duplicate_of_id }} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 hover:underline">Duplicate</Link>
                    )}
                  </div>
                  <Link to="/app/suggestions/$id" params={{ id: s.id }} className="font-semibold hover:underline">{s.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <select value={s.status} disabled={updatingId === s.id} onChange={(e) => setStatus(s.id, e.target.value as SuggestionStatus)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs disabled:opacity-60">
                    {STAFF_STATUS_OPTIONS.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                  <button onClick={() => openDuplicates(s.id, s.title)} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted">
                    <Sparkles className="h-3 w-3" /> Find duplicates
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {duplicatesFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDuplicatesFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card max-w-2xl w-full rounded-2xl border border-border p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-full bg-emerald/10 p-2"><Sparkles className="h-5 w-5 text-emerald" /></div>
              <div className="min-w-0">
                <h2 className="font-serif text-2xl">AI duplicate detection</h2>
                <p className="text-sm text-muted-foreground mt-1 truncate">For: <span className="font-medium">{duplicatesFor.title}</span></p>
              </div>
            </div>
            {duplicatesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" /> Analysing similar suggestions…
              </div>
            ) : duplicates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No similar suggestions found.</div>
            ) : (
              <ul className="space-y-2 mb-5">
                {duplicates.map((m) => (
                  <li key={m.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{m.category}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(m.similarity * 100)}% match</span>
                    </div>
                    <Link to="/app/suggestions/$id" params={{ id: m.id }} className="font-semibold hover:underline block">{m.title}</Link>
                    <div className="mt-2 flex justify-end">
                      <button disabled={merging === m.id} onClick={() => mergeInto(m.id)} className="text-xs px-3 py-1.5 rounded-md bg-navy text-white disabled:opacity-60">
                        {merging === m.id ? "Merging…" : "Mark as duplicate of this"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              {duplicatesFor && (
                <button onClick={() => mergeInto(null as unknown as string)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted">
                  Clear duplicate flag
                </button>
              )}
              <button onClick={() => setDuplicatesFor(null)} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
