import { Link } from "@tanstack/react-router";
import { Home, Inbox, PlusCircle, BarChart3 } from "lucide-react";
import { useAuth } from "./auth-provider";

export function MobileBottomNav() {
  const { user, isAdmin } = useAuth();
  if (!user) return null;
  const items = [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/app/my-suggestions", label: "Inbox", icon: Inbox },
    { to: "/app/submit", label: "Submit", icon: PlusCircle, primary: true },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: BarChart3 }] : [{ to: "/transparency", label: "Public", icon: BarChart3 }]),
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <it.icon className={`h-5 w-5 ${it.primary ? "text-emerald" : ""}`} />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
