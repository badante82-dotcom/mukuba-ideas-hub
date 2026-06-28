import { Link } from "@tanstack/react-router";
import { Home, Inbox, PlusCircle, BarChart3, Briefcase } from "lucide-react";
import { useAuth } from "./auth-provider";

export function MobileBottomNav() {
  const { user, isAdmin, roles } = useAuth();
  if (!user) return null;
  const isStaff = roles.includes("staff") || roles.includes("stakeholder");
  const isStudent = roles.includes("student");

  const items = isAdmin
    ? [
        { to: "/", label: "Home", icon: Home, exact: true },
        { to: "/admin", label: "Admin", icon: BarChart3 },
        { to: "/transparency", label: "Public", icon: BarChart3 },
      ]
    : isStaff
    ? [
        { to: "/", label: "Home", icon: Home, exact: true },
        { to: "/staff", label: "Inbox", icon: Briefcase },
        { to: "/transparency", label: "Public", icon: BarChart3 },
      ]
    : isStudent
    ? [
        { to: "/", label: "Home", icon: Home, exact: true },
        { to: "/app/my-suggestions", label: "Inbox", icon: Inbox },
        { to: "/app/submit", label: "Submit", icon: PlusCircle, primary: true },
        { to: "/transparency", label: "Public", icon: BarChart3 },
      ]
    : [
        { to: "/", label: "Home", icon: Home, exact: true },
        { to: "/transparency", label: "Public", icon: BarChart3 },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <ul className={items.length === 3 ? "grid grid-cols-3" : "grid grid-cols-4"}>
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              <it.icon className={`h-5 w-5 ${"primary" in it && it.primary ? "text-emerald" : ""}`} />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
