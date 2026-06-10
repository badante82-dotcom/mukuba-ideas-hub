import { Link } from "@tanstack/react-router";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const textColor = tone === "dark" ? "text-foreground" : "text-white";
  const subColor = tone === "dark" ? "text-muted-foreground" : "text-white/60";
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="relative h-9 w-9 rounded-lg bg-navy text-emerald-soft grid place-items-center font-serif text-base shadow-sm overflow-hidden">
        <span className="relative z-10 font-bold tracking-tight text-emerald">MU</span>
        <span className="absolute inset-0 bg-gradient-to-br from-emerald/15 via-transparent to-teal/15" />
      </div>
      <div className="leading-tight">
        <div className={`text-sm font-semibold ${textColor}`}>Smart Mukuba University</div>
        <div className={`text-xs ${subColor}`}>Suggestion Box</div>
      </div>
    </Link>
  );
}
