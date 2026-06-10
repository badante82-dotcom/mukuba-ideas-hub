import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How it works — Smart Mukuba Suggestion Box" }, { name: "description", content: "Submit, track and resolve — the workflow behind the Mukuba suggestion platform." }] }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-serif text-5xl">How it works</h1>
        <ol className="mt-10 space-y-8">
          {[
            ["Submit", "Share your suggestion using a short guided form. Pick a category and department, add details, attach files, and choose whether to stay anonymous."],
            ["Triage", "Suggestions are auto-categorised and routed to the responsible department. Similar suggestions are grouped to surface community priorities."],
            ["Respond", "Administrators reply directly — sometimes to one submitter, sometimes to many similar suggestions at once."],
            ["Resolve & publish", "Resolved suggestions appear on the public Transparency Portal so the community sees real change."],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-5">
              <div className="font-serif text-4xl text-emerald-gradient leading-none w-12 shrink-0">0{i + 1}</div>
              <div>
                <div className="font-semibold text-lg">{t}</div>
                <p className="mt-1 text-muted-foreground">{b}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  ),
});
