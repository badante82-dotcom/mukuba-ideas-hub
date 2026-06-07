import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  pendingComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">
      Loading your workspace…
    </div>
  ),
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-10 pb-24 md:pb-10"><Outlet /></main>
      <MobileBottomNav />
    </div>
  ),
});
