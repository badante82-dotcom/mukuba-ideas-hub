import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ShieldCheck, MessagesSquare, BarChart3, Sparkles,
  CheckCircle2, Clock, Users, GraduationCap, Building2, Utensils,
  Wifi, Trophy, ShieldAlert, BookOpen, Hammer, ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mukuba University — Online Suggestion Box" },
      { name: "description", content: "Submit suggestions, track progress, and see real change at Mukuba University. A modern platform built on transparency, accountability, and action." },
      { property: "og:title", content: "Mukuba University — Online Suggestion Box" },
      { property: "og:description", content: "Your voice. Your university. The official digital suggestion platform." },
    ],
  }),
  component: LandingPage,
});

function useCountUp(target: number, durationMs = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Features />
        <CategoriesGrid />
        <StatsBand />
        <Testimonials />
        <FAQSection />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-gradient">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full blur-3xl opacity-30 bg-[radial-gradient(circle_at_center,_oklch(0.7_0.16_165),_transparent_60%)]" />
      </div>
      <div className="container relative mx-auto px-4 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3.5 py-1 text-xs font-medium text-emerald-soft fade-up">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
          Mukuba University — Official Platform
        </div>
        <h1 className="mt-6 font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-white fade-up" style={{ animationDelay: "60ms" }}>
          Your Voice.
          <br />
          <span className="text-emerald-gradient">Your University.</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-base md:text-lg text-white/70 leading-relaxed fade-up" style={{ animationDelay: "140ms" }}>
          Submit suggestions, track progress, and see real change at Mukuba University.
          A modern platform built on transparency, accountability, and action.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 fade-up" style={{ animationDelay: "220ms" }}>
          <Link to="/app/submit">
            <Button size="lg" className="rounded-full px-6">
              Submit a Suggestion <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/transparency">
            <Button size="lg" variant="outline" className="rounded-full px-6 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              View Transparency Portal
            </Button>
          </Link>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, label: "End-to-end secure" },
    { icon: Clock, label: "Real-time status updates" },
    { icon: BarChart3, label: "Public accountability" },
    { icon: Sparkles, label: "Smart prioritization" },
  ];
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.label} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <it.icon className="h-4 w-4 text-emerald" />
              <span>{it.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Submit", body: "Share your idea or concern through a guided form. Stay anonymous if you prefer." },
    { n: "02", title: "Review", body: "Your suggestion is routed to the right department and prioritized intelligently." },
    { n: "03", title: "Resolve", body: "Get real-time updates and see resolved suggestions published transparently." },
  ];
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-xs uppercase tracking-widest text-emerald font-semibold mb-3">How it works</div>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">Three steps to real change</h2>
          <p className="mt-4 text-muted-foreground">A workflow designed for clarity — from your first idea to a published resolution.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-7 hover:shadow-md transition-shadow">
              <div className="font-serif text-5xl text-emerald-gradient">{s.n}</div>
              <div className="mt-4 font-semibold text-lg">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: MessagesSquare, title: "Threaded responses", body: "Administrators reply directly. Students see every update in one place." },
    { icon: BarChart3, title: "Live analytics", body: "Departments see live charts of submissions, sentiment, and resolution time." },
    { icon: Sparkles, title: "Smart grouping", body: "Similar suggestions are detected automatically — no duplicate noise." },
    { icon: ShieldCheck, title: "Anonymous when needed", body: "Sensitive feedback can be submitted privately and safely." },
    { icon: Clock, title: "Mass replies", body: "Admins respond to hundreds of related suggestions in one action." },
    { icon: Users, title: "Roles & departments", body: "Permissions for students, staff, stakeholders and admins." },
  ];
  return (
    <section className="py-24 bg-muted/30 border-y border-border/60">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-emerald font-semibold mb-3">Capabilities</div>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">Built for a modern university.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover:border-emerald/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald/10 text-emerald grid place-items-center mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesGrid() {
  const cats = [
    { icon: BookOpen, label: "Academics" }, { icon: Building2, label: "Hostel" },
    { icon: Utensils, label: "Cafeteria" }, { icon: ShieldAlert, label: "Security" },
    { icon: Wifi, label: "ICT" }, { icon: Hammer, label: "Infrastructure" },
    { icon: Trophy, label: "Sports" }, { icon: GraduationCap, label: "Administration" },
  ];
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-emerald font-semibold mb-3">Coverage</div>
          <h2 className="font-serif text-4xl md:text-5xl">Every part of campus life.</h2>
          <p className="mt-4 text-muted-foreground">From classrooms to cafeterias — every suggestion lands with the right team.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          {cats.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-3 hover:bg-accent transition-colors">
              <div className="h-9 w-9 rounded-md bg-navy/5 text-navy grid place-items-center"><c.icon className="h-4 w-4" /></div>
              <div className="font-medium text-sm">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const a = useCountUp(98);
  const b = useCountUp(42);
  const c = useCountUp(9);
  const d = useCountUp(100);
  return (
    <section className="py-20 bg-navy text-white">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { v: `${a}%`, l: "Of suggestions reviewed" },
          { v: `${b}h`, l: "Avg. first response" },
          { v: `${c}`, l: "Departments connected" },
          { v: `${d}%`, l: "Publicly accountable" },
        ].map((s) => (
          <div key={s.l}>
            <div className="font-serif text-5xl md:text-6xl text-emerald-gradient">{s.v}</div>
            <div className="mt-2 text-sm text-white/60">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "Finally a way to be heard that doesn't get lost in a paper box.", a: "Mwape — 3rd year, Engineering" },
    { q: "We're closing tickets in hours instead of weeks. Game changer.", a: "Mrs. Banda — Hostel Warden" },
    { q: "The transparency portal builds real trust with our students.", a: "Dr. Chanda — Dean of Students" },
  ];
  return (
    <section className="py-24 bg-muted/30 border-y border-border/60">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-4xl md:text-5xl text-center">From across campus</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {t.map((x) => (
            <figure key={x.a} className="rounded-2xl border border-border bg-card p-7">
              <blockquote className="font-serif text-xl leading-snug text-foreground">"{x.q}"</blockquote>
              <figcaption className="mt-5 text-sm text-muted-foreground">{x.a}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "Is my submission really anonymous?", a: "Yes. When you tick anonymous, your identity is hidden from administrators and never displayed publicly." },
    { q: "Who can see resolved suggestions?", a: "Resolved, non-sensitive suggestions appear on the Transparency Portal so the whole community can see the change." },
    { q: "How fast will I get a response?", a: "Average first response time is currently under 48 hours, with urgent items prioritised automatically." },
    { q: "Can staff also submit suggestions?", a: "Yes — students, staff and stakeholders all have accounts with role-appropriate permissions." },
  ];
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-serif text-4xl md:text-5xl text-center">Frequently asked</h2>
        <div className="mt-10 divide-y divide-border border border-border rounded-2xl bg-card">
          {faqs.map((f, i) => (
            <details key={i} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-24 bg-navy-gradient text-white relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative">
        <CheckCircle2 className="h-8 w-8 text-emerald mx-auto mb-4" />
        <h2 className="font-serif text-4xl md:text-5xl">Ready to make change happen?</h2>
        <p className="mt-4 text-white/70 max-w-xl mx-auto">Join thousands of students and staff already shaping the future of Mukuba University.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup"><Button size="lg" className="rounded-full px-6">Create an account <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/login"><Button size="lg" variant="outline" className="rounded-full px-6 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">Sign in</Button></Link>
        </div>
      </div>
    </section>
  );
}
