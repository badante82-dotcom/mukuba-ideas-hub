import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import { useTheme } from "./theme-provider";
import { useAuth } from "./auth-provider";
import { Moon, Sun, LogOut, LayoutDashboard, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "./notifications-bell";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { user, isAdmin, loading } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>How it works</Link>
            <Link to="/transparency" className="text-muted-foreground hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Transparency</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Contact</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle} className="rounded-full">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {!loading && !user && (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/signup"><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4">Get Started</Button></Link>
            </>
          )}
          {!loading && user && <NotificationsBell />}
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  {user.email?.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/app/my-suggestions"><Inbox className="mr-2 h-4 w-4" />My suggestions</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
