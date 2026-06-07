import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Paperclip, X } from "lucide-react";

const CATEGORIES = ["academics","hostel","cafeteria","security","administration","ict","infrastructure","sports","other"] as const;
const PRIORITIES = ["low","medium","high","urgent"] as const;
const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png","image/jpeg","image/webp","application/pdf"];

export const Route = createFileRoute("/app/submit")({
  head: () => ({ meta: [{ title: "Submit a suggestion — Mukuba" }] }),
  component: SubmitPage,
});

function SubmitPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("other");
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>("medium");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const onFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    const next: File[] = [...files];
    for (const f of list) {
      if (next.length >= MAX_FILES) { toast.error(`Max ${MAX_FILES} files`); break; }
      if (!ALLOWED.includes(f.type)) { toast.error(`${f.name}: unsupported type`); continue; }
      if (f.size > MAX_SIZE) { toast.error(`${f.name}: max 5 MB`); continue; }
      next.push(f);
    }
    setFiles(next);
    e.target.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) return toast.error("Title is too short");
    if (body.trim().length < 20) return toast.error("Please describe your suggestion (at least 20 characters)");
    if (!user) return toast.error("You must be signed in");
    setLoading(true);
    const toastId = toast.loading("Submitting your suggestion…");
    const { data, error } = await supabase.from("suggestions").insert({
      author_id: anonymous ? null : user.id,
      title: title.trim(),
      body: body.trim(),
      category,
      priority,
      department_id: departmentId || null,
      is_anonymous: anonymous,
    }).select("id").single();
    if (error || !data) {
      setLoading(false);
      toast.dismiss(toastId);
      return toast.error(error?.message ?? "Failed to submit");
    }

    // Upload attachments (best-effort)
    for (const f of files) {
      const path = `${user.id}/${data.id}/${crypto.randomUUID()}-${f.name}`;
      const { error: upErr } = await supabase.storage.from("suggestion-attachments").upload(path, f, { contentType: f.type });
      if (upErr) { toast.error(`${f.name}: ${upErr.message}`); continue; }
      await supabase.from("attachments").insert({
        suggestion_id: data.id,
        storage_path: path,
        filename: f.name,
        mime_type: f.type,
        size_bytes: f.size,
      });
    }
    setLoading(false);
    toast.dismiss(toastId);
    toast.success("Suggestion submitted");
    navigate({ to: "/app/suggestions/$id", params: { id: data.id } });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl">Submit a suggestion</h1>
        <p className="mt-2 text-muted-foreground">Your idea will be routed to the right team and you'll be kept in the loop.</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Briefly summarise your suggestion" maxLength={200} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as typeof PRIORITIES[number])} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
              {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Department (optional)</Label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">— Auto-route —</option>
            {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body">Details</Label>
          <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={4000} placeholder="Describe your suggestion or concern in detail…" required />
        </div>

        <div className="space-y-2">
          <Label>Attachments <span className="text-muted-foreground font-normal">(optional — up to {MAX_FILES} files, 5 MB each)</span></Label>
          <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition">
            <Paperclip className="h-4 w-4" />
            <span>Click to attach photos or PDFs</span>
            <input type="file" multiple accept={ALLOWED.join(",")} className="sr-only" onChange={onFilesPicked} />
          </label>
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <span className="truncate flex-1">{f.name} <span className="text-xs text-muted-foreground">· {(f.size/1024).toFixed(0)} KB</span></span>
                  <button type="button" onClick={() => setFiles(files.filter((_,j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 rounded border-input" />
          Submit anonymously
        </label>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Submitting…" : "Submit suggestion"}</Button>
      </form>
    </div>
  );
}

