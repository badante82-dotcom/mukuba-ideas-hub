import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare, ShieldCheck, Paperclip, Send } from "lucide-react";
import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/app/suggestions/$id")({
  head: () => ({ meta: [{ title: "Suggestion — Mukuba" }] }),
  component: SuggestionDetail,
});


const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  under_review: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  resolved: "bg-emerald/10 text-emerald",
  rejected: "bg-destructive/10 text-destructive",
};

function SuggestionDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user, isAdmin, roles } = useAuth();
  const canRespond = isAdmin || roles.includes("staff");
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const sendReply = async () => {
    if (!user || reply.trim().length < 3) return;
    setSending(true);
    const { error } = await supabase.from("responses").insert({
      suggestion_id: id,
      author_id: user.id,
      body: reply.trim(),
      is_internal_note: false,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setReply("");
    toast.success("Response posted");
    qc.invalidateQueries({ queryKey: ["suggestion", id] });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["suggestion", id],
    queryFn: async () => {
      const [s, r, a] = await Promise.all([
        supabase.from("suggestions").select("*").eq("id", id).single(),
        supabase.from("responses").select("id,body,created_at,is_internal_note").eq("suggestion_id", id).eq("is_internal_note", false).order("created_at"),
        supabase.from("attachments").select("id,filename,storage_path,mime_type,size_bytes").eq("suggestion_id", id),
      ]);
      if (s.error) throw s.error;
      const attachments = await Promise.all((a.data ?? []).map(async (att) => {
        const { data: signed } = await supabase.storage.from("suggestion-attachments").createSignedUrl(att.storage_path, 3600);
        return { ...att, url: signed?.signedUrl ?? null };
      }));
      return { suggestion: s.data, responses: r.data ?? [], attachments };
    },
  });

  React.useEffect(() => {
    const ch = supabase
      .channel(`suggestion-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "responses", filter: `suggestion_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["suggestion", id] }))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "suggestions", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["suggestion", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  if (isLoading) return <div className="max-w-3xl mx-auto"><div className="h-40 rounded-xl bg-muted animate-pulse" /></div>;
  if (!data) return null;
  const s = data.suggestion;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/app/my-suggestions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[s.status] ?? "bg-muted"}`}>{s.status.replace("_"," ")}</span>
          <span className="text-xs uppercase tracking-wider text-emerald font-semibold">{s.category}</span>
        </div>
        <h1 className="font-serif text-4xl">{s.title}</h1>
        <p className="mt-5 whitespace-pre-wrap text-muted-foreground leading-relaxed">{s.body}</p>
        <div className="mt-6 text-xs text-muted-foreground">Submitted {new Date(s.created_at).toLocaleString()}</div>
        {data.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Paperclip className="h-3 w-3" />Attachments</div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {data.attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted transition">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{a.filename}</span>
                    <span className="text-xs text-muted-foreground">{((a.size_bytes ?? 0)/1024).toFixed(0)} KB</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h2 className="font-serif text-2xl mt-10 mb-4">Responses</h2>
      {!data.responses.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No responses yet. We'll notify you when an administrator replies.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.responses.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2 text-xs text-emerald font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Administration
                <span className="text-muted-foreground font-normal">• {new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {canRespond && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-emerald">
            <ShieldCheck className="h-3.5 w-3.5" /> Respond as {isAdmin ? "Administration" : "Staff"}
          </div>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a public response to the submitter…" maxLength={4000} />
          <div className="mt-3 flex justify-end">
            <Button onClick={sendReply} disabled={sending || reply.trim().length < 3} className="rounded-full">
              <Send className="h-4 w-4 mr-1.5" />{sending ? "Sending…" : "Post response"}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
