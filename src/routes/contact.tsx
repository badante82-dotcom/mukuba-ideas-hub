import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Mukuba Suggestion Box" }, { name: "description", content: "Get in touch with the Mukuba University suggestion platform team." }] }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="font-serif text-5xl">Contact</h1>
        <p className="mt-4 text-muted-foreground">For platform issues or general queries.</p>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: "Email", value: "suggestions@mukuba.edu.zm" },
            { icon: Phone, label: "Phone", value: "+260 212 000 000" },
            { icon: MapPin, label: "Office", value: "Main Campus, Kitwe" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <c.icon className="h-5 w-5 text-emerald" />
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-medium">{c.value}</div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});
