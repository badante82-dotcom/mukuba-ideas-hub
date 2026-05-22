import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              The official digital suggestion platform of Mukuba University.
              Built on transparency, accountability, and action.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Platform</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
              <li><Link to="/transparency" className="hover:text-foreground">Transparency portal</Link></li>
              <li><Link to="/app/submit" className="hover:text-foreground">Submit a suggestion</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">University</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <div>© {new Date().getFullYear()} Mukuba University. All rights reserved.</div>
          <div>Built for students, staff, and stakeholders.</div>
        </div>
      </div>
    </footer>
  );
}
