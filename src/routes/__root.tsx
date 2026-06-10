import { QueryClient, QueryClientProvider, useIsFetching, useIsMutating, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-serif text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smart Mukuba University Suggestion Box" },
      { name: "description", content: "Submit suggestions, track progress, and see real change at Mukuba University. A modern platform built on transparency, accountability, and action." },
      { name: "author", content: "Mukuba University" },
      { property: "og:title", content: "Smart Mukuba University Suggestion Box" },
      { property: "og:description", content: "Submit suggestions, track progress, and see real change at Mukuba University. A modern platform built on transparency, accountability, and action." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Smart Mukuba University Suggestion Box" },
      { name: "twitter:description", content: "Submit suggestions, track progress, and see real change at Mukuba University. A modern platform built on transparency, accountability, and action." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c6bc1b7f-2f88-4e21-9611-760f7ea417e3" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c6bc1b7f-2f88-4e21-9611-760f7ea417e3" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PreviewStylesFallback() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("__lovable_token");
    if (!token || document.getElementById("preview-styles-fallback")) return;

    const link = document.createElement("link");
    link.id = "preview-styles-fallback";
    link.rel = "stylesheet";
    link.href = `${appCss}${appCss.includes("?") ? "&" : "?"}__lovable_token=${encodeURIComponent(token)}`;
    document.head.appendChild(link);
  }, []);

  return null;
}

function AuthInvalidator() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        qc.clear();
        router.invalidate();
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        qc.invalidateQueries();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}

function GlobalLoadingIndicator() {
  const { loading } = useAuth();
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = loading || fetching > 0 || mutating > 0;

  return (
    <div
      aria-hidden={!active}
      className={`fixed inset-x-0 top-0 z-[100] h-1 bg-primary transition-opacity duration-200 ${active ? "opacity-100 animate-pulse" : "opacity-0"}`}
    />
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PreviewStylesFallback />
          <AuthInvalidator />
          <GlobalLoadingIndicator />
          <Outlet />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
