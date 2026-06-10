import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock } from "lucide-react";
import { getStatusBadgeClass, getSuggestionStatusLabel, getTransparencyStatus, type TransparencyStatus } from "@/lib/suggestion-status";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/transparency")({
  head: () => ({ meta: [{ title: "Transparency Portal — Smart Mukuba Suggestion Box" }, { name: "description", content: "Browse resolved suggestions and see how Mukuba University is responding to its community." }] }),
  component: TransparencyPage,
});

function TransparencyPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TransparencyStatus | "all">("all");
  const locked = !loading && !user;

  const { data, isLoading } = useQuery({
    queryKey: ["transparency", !!user],
    enabled: !loading,
    queryFn: async () => {
      let q = supabase
        .from("suggestions")
        .select("id,title,body,category,status,resolved_at,created_at,upvotes_count")
        .eq("is_public", true);
      if (locked) q = q.eq("status", "resolved");
      const { data, error } = await q
        .order("created_at", { ascending: false })
        .limit(locked ? 6 : 100);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (locked) return;
    const channel = supabase
      .channel("transparency-suggestions")
      .on("postgres_changes", { event: "*", schema: "public", table: "suggestions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["transparency", !!user] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locked, queryClient, user]);

  const counts = useMemo(() => {
    const rows = data ?? [];
    return {
      all: rows.length,
      pending: rows.filter((s) => getTransparencyStatus(s.status) === "pending").length,
      resolved: rows.filter((s) => getTransparencyStatus(s.status) === "resolved").length,
      denied: rows.filter((s) => getTransparencyStatus(s.status) === "denied").length,
    };
  }, [data]);

  const visibleSuggestions = useMemo(() => {
    const rows = data ?? [];
    if (filter === "all") return rows;
    return rows.filter((s) => getTransparencyStatus(s.status) === filter);
  }, [data, filter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-navy-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald-soft fade-up">
              <CheckCircle2 className="h-3.5 w-3.5" /> Public accountability
            </div>
            <h1 className="mt-5 font-serif text-5xl md:text-6xl fade-up" style={{ animationDelay: "60ms" }}>Transparency Portal</h1>
            <p className="mt-4 max-w-xl mx-auto text-white/70 fade-up" style={{ animationDelay: "140ms" }}>Every public suggestion, open for the community — from newly submitted ideas to resolved outcomes.</p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 max-w-4xl relative">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : !data?.length ? (
            <div className="text-center py-20">
              <CheckCircle2 className="h-10 w-10 text-emerald mx-auto mb-3 opacity-50" />
              <h2 className="font-serif text-2xl">No public suggestions yet</h2>
              <p className="mt-2 text-muted-foreground">Be the first to submit one — it will appear here.</p>
            </div>
          ) : (
            <div className="relative">
              {!locked && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {([
                    ["all", "All", counts.all],
                    ["pending", "Pending", counts.pending],
                    ["resolved", "Resolved", counts.resolved],
                    ["denied", "Denied", counts.denied],
                  ] as const).map(([value, label, count]) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}
                    >
                      {label} <span className="ml-1 opacity-70">{count}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className={locked ? "space-y-4 select-none pointer-events-none [filter:blur(8px)]" : "space-y-4"} aria-hidden={locked}>
                {visibleSuggestions.map((s, i) => {
                  const statusLabel = getSuggestionStatusLabel(s.status, true);
                  const isResolved = s.status === "resolved";
                  const dateStr = isResolved && s.resolved_at
                    ? new Date(s.resolved_at).toLocaleDateString()
                    : new Date(s.created_at).toLocaleDateString();
                  return (
                  <Link
                    key={s.id}
                    to="/app/suggestions/$id"
                    params={{ id: s.id }}
                    className="block rounded-2xl border border-border bg-card p-6 hover:border-emerald/40 transition-all hover-lift fade-up hover:shadow-md hover:bg-accent/30"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-emerald font-semibold">{s.category}</div>
                        <h3 className="mt-1 font-serif text-2xl">{s.title}</h3>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{dateStr}</div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.body}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${getStatusBadgeClass(s.status, true)}`}>
                        {isResolved && <CheckCircle2 className="h-3 w-3" />} {statusLabel}
                      </span>
                      <span className="text-muted-foreground">{s.upvotes_count} upvotes</span>
                    </div>
                  </Link>
                  );
                })}
              </div>


              {locked && (
                <div className="absolute inset-0 flex items-start justify-center pt-16">
                  <div className="max-w-md w-[92%] rounded-2xl border border-border bg-card/95 backdrop-blur-md p-8 text-center shadow-xl fade-up">
                    <div className="mx-auto h-12 w-12 rounded-full bg-emerald/10 text-emerald grid place-items-center">
                      <Lock className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 font-serif text-3xl">Sign in to see resolved suggestions</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      The transparency portal is reserved for the Mukuba community. Sign in or create an account to view how the university is responding.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <Link to="/login"><Button className="rounded-full px-5">Sign in</Button></Link>
                      <Link to="/signup"><Button variant="outline" className="rounded-full px-5">Create account</Button></Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
