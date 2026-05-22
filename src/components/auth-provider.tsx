import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AppRole = "student" | "staff" | "stakeholder" | "admin" | "super_admin";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [roles, setRoles] = React.useState<AppRole[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadRoles = React.useCallback(async (uid: string | undefined) => {
    if (!uid) { setRoles([]); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  }, []);

  React.useEffect(() => {
    // 1) listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // defer DB call to avoid deadlock
      setTimeout(() => { void loadRoles(s?.user?.id); }, 0);
    });
    // 2) then initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      void loadRoles(s?.user?.id).finally(() => setLoading(false));
    });
    return () => subscription.unsubscribe();
  }, [loadRoles]);

  const refresh = React.useCallback(async () => {
    await loadRoles(user?.id);
  }, [user?.id, loadRoles]);

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, isAdmin, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
