import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

function Shell({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-serif text-5xl">{title}</h1>
        {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
        <div className="mt-10 prose prose-neutral dark:prose-invert max-w-none text-foreground">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Smart Mukuba Suggestion Box" }, { name: "description", content: "About the Mukuba University Online Suggestion Box." }] }),
  component: () => (
    <Shell title="About the platform" lead="A modern, transparent channel between the Mukuba University community and its administration.">
      <p>The Online Suggestion Box replaces the traditional physical box with a secure digital workflow that routes every idea, concern and complaint to the right department — and keeps you informed every step of the way.</p>
      <p>We built it around three values: <strong>transparency</strong>, <strong>accountability</strong>, and <strong>action</strong>. Resolved suggestions are published openly so the whole community can see the change.</p>
    </Shell>
  ),
});
