import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMBED_MODEL = "google/gemini-embedding-001";
const EMBED_DIMS = 768;
const SIMILARITY_THRESHOLD = 0.78;
const SEARCH_LIMIT = 300;

async function embedText(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text.slice(0, 8000),
      dimensions: EMBED_DIMS,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Embedding failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!vec || !Array.isArray(vec)) throw new Error("No embedding returned");
  return vec;
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

const FindSimilarInput = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(8000),
  excludeId: z.string().uuid().optional(),
});

export const findSimilarSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FindSimilarInput.parse(d))
  .handler(async ({ data }) => {
    const text = `${data.title}\n\n${data.body}`;
    const query = await embedText(text);

    // Pull recent embeddings + suggestion metadata
    const { data: rows, error } = await supabaseAdmin
      .from("suggestion_embeddings")
      .select("suggestion_id, embedding, suggestions!inner(id,title,body,status,category,created_at,is_public,deleted_at,duplicate_of_id)")
      .order("created_at", { ascending: false })
      .limit(SEARCH_LIMIT);
    if (error) throw new Error(error.message);

    const matches: Array<{
      id: string; title: string; body: string; status: string;
      category: string; created_at: string; similarity: number;
    }> = [];

    for (const r of rows ?? []) {
      const s = (r as any).suggestions;
      if (!s || s.deleted_at || !s.is_public) continue;
      if (data.excludeId && s.id === data.excludeId) continue;
      if (s.duplicate_of_id) continue;
      const emb = (r as any).embedding;
      const vec = Array.isArray(emb) ? (emb as number[]) : null;
      if (!vec) continue;
      const sim = cosine(query, vec);
      if (sim >= SIMILARITY_THRESHOLD) {
        matches.push({
          id: s.id, title: s.title, body: s.body, status: s.status,
          category: s.category, created_at: s.created_at, similarity: sim,
        });
      }
    }
    matches.sort((a, b) => b.similarity - a.similarity);
    return { matches: matches.slice(0, 5) };
  });

const EmbedInput = z.object({ id: z.string().uuid() });

export const embedSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmbedInput.parse(d))
  .handler(async ({ data }) => {
    const { data: s, error } = await supabaseAdmin
      .from("suggestions")
      .select("id,title,body")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!s) throw new Error("Suggestion not found");
    const vec = await embedText(`${s.title}\n\n${s.body}`);
    const { error: upErr } = await supabaseAdmin
      .from("suggestion_embeddings")
      .upsert({ suggestion_id: s.id, embedding: vec as unknown as never });
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

const SimilarToInput = z.object({ id: z.string().uuid() });

export const findSimilarToSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SimilarToInput.parse(d))
  .handler(async ({ data, context }) => {
    // Admin only
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin" || r.role === "staff");
    if (!isAdmin) throw new Error("Forbidden");

    const { data: src } = await supabaseAdmin
      .from("suggestion_embeddings").select("embedding").eq("suggestion_id", data.id).maybeSingle();
    let query: number[] | null = (src?.embedding as unknown as number[]) ?? null;

    if (!query) {
      // Embed on demand
      const { data: s } = await supabaseAdmin
        .from("suggestions").select("title,body").eq("id", data.id).maybeSingle();
      if (!s) throw new Error("Suggestion not found");
      query = await embedText(`${s.title}\n\n${s.body}`);
      await supabaseAdmin.from("suggestion_embeddings").upsert({ suggestion_id: data.id, embedding: query as unknown as never });
    }

    const { data: rows, error } = await supabaseAdmin
      .from("suggestion_embeddings")
      .select("suggestion_id, embedding, suggestions!inner(id,title,status,category,created_at,deleted_at,duplicate_of_id)")
      .neq("suggestion_id", data.id)
      .limit(SEARCH_LIMIT);
    if (error) throw new Error(error.message);

    const matches: Array<{ id: string; title: string; status: string; category: string; similarity: number }> = [];
    for (const r of rows ?? []) {
      const s = (r as any).suggestions;
      if (!s || s.deleted_at) continue;
      const vec = (r as any).embedding as number[] | null;
      if (!Array.isArray(vec)) continue;
      const sim = cosine(query!, vec);
      if (sim >= SIMILARITY_THRESHOLD) {
        matches.push({ id: s.id, title: s.title, status: s.status, category: s.category, similarity: sim });
      }
    }
    matches.sort((a, b) => b.similarity - a.similarity);
    return { matches: matches.slice(0, 10) };
  });

const MarkDupInput = z.object({
  id: z.string().uuid(),
  duplicateOfId: z.string().uuid().nullable(),
});

export const markAsDuplicate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MarkDupInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin" || r.role === "staff");
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await supabaseAdmin
      .from("suggestions")
      .update({ duplicate_of_id: data.duplicateOfId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
