import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { getSuggestionStatusLabel, STAFF_STATUS_OPTIONS } from "@/lib/suggestion-status";

const STATUSES = STAFF_STATUS_OPTIONS.map((option) => option.value);
const CATEGORIES = ["all","academics","hostel","cafeteria","security","administration","ict","infrastructure","sports","other"] as const;

export const Route = createFileRoute("/admin/mass-reply")({
  head: () => ({ meta: [{ title: "Admin — Mass reply" }] }),
  component: MassReply,
});

function MassReply() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("submitted");
  const [keyword, setKeyword] = useState("");
  const [body, setBody] = useState("");
  const [setStatusTo, setSetStatusTo] = useState<string>("");
  const [sending, setSending] = useState(false);

  const { data: matches, refetch } = useQuery({
    queryKey: ["mass-reply-matches", category, status, keyword],
    queryFn: async () => {
      let q = supabase.from("suggestions").select("id,title,category,status").limit(500);
      if (category !== "all") q = q.eq("category", category as "other");
      if (status !== "all") q = q.eq("status", status as "submitted");
      if (keyword.trim()) q = q.ilike("title", `%${keyword.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const send = async () => {
    if (!matches?.length) return toast.error("No matching suggestions");
    if (body.trim().length < 10) return toast.error("Response is too short");
    if (!user) return;
    setSending(true);

    const filter = { category, status, keyword };
    const { data: mass, error: mErr } = await supabase.from("mass_replies").insert({
      admin_id: user.id, body: body.trim(), filter_snapshot: filter,
      recipients_count: matches.length,
      also_set_status: setStatusTo ? (setStatusTo as "resolved") : null,
    }).select("id").single();

    if (mErr) { setSending(false); return toast.error(mErr.message); }

    const responses = matches.map((m) => ({
      suggestion_id: m.id, author_id: user.id, body: body.trim(), mass_reply_id: mass!.id, is_internal_note: false,
    }));
    const targets = matches.map((m) => ({ mass_reply_id: mass!.id, suggestion_id: m.id }));

    await supabase.from("responses").insert(responses);
    await supabase.from("mass_reply_targets").insert(targets);

    if (setStatusTo) {
      await supabase.from("suggestions").update({
        status: setStatusTo as "resolved",
        resolved_at: setStatusTo === "resolved" ? new Date().toISOString() : null,
      }).in("id", matches.map((m) => m.id));
    }

    setSending(false);
    toast.success(`Reply sent to ${matches.length} suggestion${matches.length === 1 ? "" : "s"}`);
    setBody(""); setSetStatusTo(""); refetch();
  };

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-4xl mb-2">Mass reply</h1>
      <p className="text-muted-foreground mb-8">Filter similar suggestions and respond to them in a single action.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="font-semibold">1. Filter recipients</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
                <option value="all">All</option>
                {STATUSES.map((s) => <option key={s} value={s}>{getSuggestionStatusLabel(s)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Keyword in title (optional)</Label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. wifi, water" className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" />
          </div>
          <div className="text-sm text-muted-foreground border-t border-border pt-3">
            Matched <span className="font-semibold text-foreground">{matches?.length ?? 0}</span> suggestion{matches?.length === 1 ? "" : "s"}.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="font-semibold">2. Compose response</div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={2000} placeholder="Write a message that will be sent to every matched suggestion…" />
          <div>
            <Label className="text-xs">Also set status (optional)</Label>
            <select value={setStatusTo} onChange={(e) => setSetStatusTo(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="">Don't change status</option>
              {STATUSES.map((s) => <option key={s} value={s}>Set to {getSuggestionStatusLabel(s)}</option>)}
            </select>
          </div>
          <Button onClick={send} disabled={sending || !matches?.length} className="w-full">
            <Send className="h-4 w-4" /> {sending ? "Sending…" : `Send to ${matches?.length ?? 0} recipient${matches?.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {!!matches?.length && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="font-semibold mb-3">Preview ({matches.length})</div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto text-sm">
            {matches.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                <span className="text-xs uppercase tracking-wider text-emerald font-semibold w-24 shrink-0">{m.category}</span>
                <span className="truncate">{m.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
