import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Mukuba Suggestion Box" }, { name: "description", content: "Frequently asked questions about the Mukuba suggestion platform." }] }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-serif text-5xl">FAQ</h1>
        <div className="mt-10 space-y-6">
          {[
            ["Is my submission really anonymous?", "Yes. When anonymous is ticked your identity is never shown to administrators or published publicly."],
            ["Who can see my suggestions?", "Only you and authorised administrators. Resolved, non-sensitive items appear on the Transparency Portal."],
            ["What if I forget my password?", "Use Forgot password on the sign-in page — we'll email you a secure reset link."],
            ["How are suggestions prioritised?", "We combine urgency, frequency of similar reports, and sentiment to surface the most pressing issues first."],
          ].map(([q, a]) => (
            <div key={q} className="rounded-xl border border-border bg-card p-5">
              <div className="font-semibold">{q}</div>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});
