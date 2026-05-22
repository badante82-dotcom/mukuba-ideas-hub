import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/transparency")({
  head: () => ({ meta: [{ title: "Transparency Portal — Mukuba Suggestion Box" }, { name: "description", content: "Browse resolved suggestions and see how Mukuba University is responding to its community." }] }),
  component: TransparencyPage,
});

function TransparencyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["transparency"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suggestions")
        .select("id,title,body,category,resolved_at,upvotes_count")
        .eq("status", "resolved")
        .eq("is_public", true)
        .order("resolved_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-navy-gradient text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald-soft">
              <CheckCircle2 className="h-3.5 w-3.5" /> Public accountability
            </div>
            <h1 className="mt-5 font-serif text-5xl md:text-6xl">Transparency Portal</h1>
            <p className="mt-4 max-w-xl mx-auto text-white/70">Every resolved suggestion, published openly. See real change happening across campus.</p>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : !data?.length ? (
            <div className="text-center py-20">
              <CheckCircle2 className="h-10 w-10 text-emerald mx-auto mb-3 opacity-50" />
              <h2 className="font-serif text-2xl">No resolved suggestions yet</h2>
              <p className="mt-2 text-muted-foreground">Check back soon — published outcomes will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((s) => (
                <article key={s.id} className="rounded-2xl border border-border bg-card p-6 hover:border-emerald/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-emerald font-semibold">{s.category}</div>
                      <h3 className="mt-1 font-serif text-2xl">{s.title}</h3>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {s.resolved_at ? new Date(s.resolved_at).toLocaleDateString() : ""}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.body}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 text-emerald px-2.5 py-1">
                      <CheckCircle2 className="h-3 w-3" /> Resolved
                    </span>
                    <span className="text-muted-foreground">{s.upvotes_count} upvotes</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
