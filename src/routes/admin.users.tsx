import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin — Users" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id,full_name,university_email,student_id,status,created_at").order("created_at", { ascending: false }).limit(200);
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      const rolesByUser: Record<string, string[]> = {};
      (roles ?? []).forEach((r) => { (rolesByUser[r.user_id] ??= []).push(r.role); });
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser[p.id] ?? [] }));
    },
  });

  const promote = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("Promoted to admin");
    refetch();
  };
  const setStatus = async (userId: string, status: "approved" | "banned") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success(`Account ${status}`);
    refetch();
  };

  return (
    <div>
      <h1 className="font-serif text-4xl mb-6">Users</h1>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.university_email}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">{u.status}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{u.roles.join(", ")}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  {!u.roles.includes("admin") && <Button size="sm" variant="outline" onClick={() => promote(u.id)}>Make admin</Button>}
                  {u.status !== "banned" ? (
                    <Button size="sm" variant="outline" onClick={() => setStatus(u.id, "banned")}>Ban</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setStatus(u.id, "approved")}>Unban</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
