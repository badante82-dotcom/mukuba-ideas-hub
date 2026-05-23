import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare, ShieldCheck, Paperclip } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/app/suggestions/$id")({
  head: () => ({ meta: [{ title: "Suggestion — Mukuba" }] }),
  component: SuggestionDetail,
});

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  under_review: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  resolved: "bg-emerald/10 text-emerald",
  rejected: "bg-destructive/10 text-destructive",
};

function SuggestionDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["suggestion", id],
    queryFn: async () => {
      const [s, r] = await Promise.all([
        supabase.from("suggestions").select("*").eq("id", id).single(),
        supabase.from("responses").select("id,body,created_at,is_internal_note").eq("suggestion_id", id).eq("is_internal_note", false).order("created_at"),
      ]);
      if (s.error) throw s.error;
      return { suggestion: s.data, responses: r.data ?? [] };
    },
  });

  if (isLoading) return <div className="max-w-3xl mx-auto"><div className="h-40 rounded-xl bg-muted animate-pulse" /></div>;
  if (!data) return null;
  const s = data.suggestion;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/app/my-suggestions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[s.status] ?? "bg-muted"}`}>{s.status.replace("_"," ")}</span>
          <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
        </div>
        <h1 className="font-serif text-4xl">{s.title}</h1>
        <p className="mt-5 whitespace-pre-wrap text-muted-foreground leading-relaxed">{s.body}</p>
        <div className="mt-6 text-xs text-muted-foreground">Submitted {new Date(s.created_at).toLocaleString()}</div>
      </div>

      <h2 className="font-serif text-2xl mt-10 mb-4">Responses</h2>
      {!data.responses.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No responses yet. We'll notify you when an administrator replies.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.responses.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2 text-xs text-emerald font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Administration
                <span className="text-muted-foreground font-normal">• {new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
