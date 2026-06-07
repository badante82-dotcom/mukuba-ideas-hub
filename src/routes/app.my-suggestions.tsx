import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { getStatusBadgeClass, getSuggestionStatusLabel } from "@/lib/suggestion-status";

export const Route = createFileRoute("/app/my-suggestions")({
  head: () => ({ meta: [{ title: "My suggestions — Mukuba" }] }),
  component: MySuggestions,
});

function MySuggestions() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-suggestions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestions")
        .select("id,title,body,category,status,priority,created_at,responses_count")
        .eq("author_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl">My suggestions</h1>
          <p className="mt-2 text-muted-foreground">Track every suggestion you've submitted.</p>
        </div>
        <Link to="/app/submit"><Button><Plus className="h-4 w-4" /> New</Button></Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i)=><div key={i} className="h-24 rounded-xl bg-muted animate-pulse"/>)}</div>
      ) : !data?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h2 className="font-serif text-2xl">No suggestions yet</h2>
          <p className="mt-2 text-muted-foreground">Start the conversation — submit your first suggestion.</p>
          <Link to="/app/submit" className="inline-block mt-5"><Button>Submit a suggestion</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((s) => (
            <Link key={s.id} to="/app/suggestions/$id" params={{ id: s.id }} className="block">
              <article className="rounded-2xl border border-border bg-card p-5 hover:border-emerald/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(s.status)}`}>{getSuggestionStatusLabel(s.status)}</span>
                      <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
                    </div>
                    <h3 className="font-semibold truncate">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.body}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-3">
                  <span>{s.responses_count} responses</span>
                  <span className="capitalize">Priority: {s.priority}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
