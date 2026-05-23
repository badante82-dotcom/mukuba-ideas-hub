import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2, Ban } from "lucide-react";

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({ meta: [{ title: "Admin — Moderation" }] }),
  component: Moderation,
});

function Moderation() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-moderation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestions")
        .select("id,title,body,category,status,priority,spam_score,sentiment_label,created_at,author_id,is_anonymous")
        .or("spam_score.gte.0.5,sentiment_label.eq.negative,priority.eq.urgent")
        .neq("status", "rejected")
        .order("spam_score", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const act = async (id: string, action: "approve" | "reject") => {
    const status = action === "reject" ? "rejected" : "under_review";
    const { error } = await supabase.from("suggestions").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(action === "reject" ? "Suggestion rejected" : "Approved for review");
    refetch();
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl flex items-center gap-2"><ShieldAlert className="h-7 w-7 text-emerald" />Moderation queue</h1>
          <p className="text-muted-foreground mt-2">Items flagged as spammy, highly negative, or marked urgent.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i)=><div key={i} className="h-24 rounded-xl bg-muted animate-pulse"/>)}</div>
      ) : !data?.length ? (
        <div className="text-center py-20 text-muted-foreground rounded-2xl border border-dashed border-border">
          Nothing in the moderation queue. ✨
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((s) => (
            <article key={s.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {Number(s.spam_score) >= 0.5 && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">spam {Number(s.spam_score).toFixed(2)}</span>}
                    {s.sentiment_label === "negative" && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">negative</span>}
                    {s.priority === "urgent" && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">urgent</span>}
                    <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
                    {s.is_anonymous && <span className="text-xs text-muted-foreground">· anonymous</span>}
                  </div>
                  <Link to="/app/suggestions/$id" params={{ id: s.id }} className="font-semibold hover:underline">{s.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => act(s.id, "approve")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => act(s.id, "reject")}><Ban className="h-3.5 w-3.5 mr-1" />Reject</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
