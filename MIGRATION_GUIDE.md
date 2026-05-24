# Mukuba Suggestion Box — Portability & Migration Guide

This guide lets you move the project to another editor / machine (VS Code, Cursor, WebStorm, etc.) and bring the database with it.

---

## 1. Prerequisites

- **Node 20+** and **Bun 1.x** (`curl -fsSL https://bun.sh/install | bash`)
- **Git**
- A **Supabase** project (cloud or self-hosted) — or keep using Lovable Cloud
- Optional: **Supabase CLI** (`npm i -g supabase`) for local DB + migration replay

## 2. Get the code

Pull the project from GitHub (use the *Connect to GitHub* button in Lovable, then clone):

```bash
git clone https://github.com/<your-org>/<your-repo>.git mukuba-suggestion-box
cd mukuba-suggestion-box
bun install
```

## 3. Environment variables

Create `.env` from the template:

```bash
cp .env.example .env
```

Fill it with values from **Supabase → Project Settings → API**:

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Settings → API → `anon` / publishable key |
| `VITE_SUPABASE_PROJECT_ID` | The slug in the URL |
| `SUPABASE_URL` | same as above |
| `SUPABASE_PUBLISHABLE_KEY` | same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` (server-only, **never commit**) |
| `LOVABLE_API_KEY` | (only if you keep using Lovable AI Gateway) |

> ⚠️ Never commit `.env`. The file is already gitignored.

## 4. Recreate the database

All schema, RLS policies, triggers, functions and storage buckets live in **`supabase/migrations/`** as plain SQL files. They are executed in filename order.

### Option A — On a fresh Supabase project (cloud)

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # applies every file in supabase/migrations/ in order
```

### Option B — Local Supabase (Docker)

```bash
supabase start            # boots a local Postgres + Studio at localhost:54323
supabase db reset         # runs all migrations against the local DB
```

Then point your `.env` to the local URL/keys printed by `supabase start`.

### Option C — Manual

Open each file in `supabase/migrations/` (ordered by timestamp) in the SQL editor and run them in order. The files are self-contained — no external state required.

## 5. Storage bucket

The app uses a private bucket called **`suggestion-attachments`**. The first migration that references it creates it; if you're restoring manually, run:

```sql
insert into storage.buckets (id, name, public) values ('suggestion-attachments', 'suggestion-attachments', false);
```

RLS policies for the bucket are included in the security migration.

## 6. Auth providers

In **Supabase → Authentication → Providers**:

- **Email** — enabled. For development you may turn off "Confirm email".
- **Google** — paste your OAuth client id/secret if you want social sign-in.
- Set **Site URL** to your production URL and add localhost to **Redirect URLs**.

## 7. Demo users & seed data

After migrations run, create the demo accounts via Supabase Auth (Dashboard → Authentication → Add user) or by signing up:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@mukuba.edu.zm` | `Admin@Mukuba2026` |
| Staff | `registrar@mukuba.edu.zm` | `Registrar@2026` |
| Student | `kabwe.j@student.mukuba.edu.zm` | `Student@2026` |

Then promote the admin in SQL:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@mukuba.edu.zm'
on conflict do nothing;

insert into public.user_roles (user_id, role)
select id, 'staff' from auth.users where email = 'registrar@mukuba.edu.zm'
on conflict do nothing;
```

## 8. Run locally

```bash
bun run dev          # http://localhost:8080
```

Build & preview:

```bash
bun run build
bun run start
```

## 9. Deploy outside Lovable

The project is a standard **TanStack Start** app and works on any Node/edge host:

- **Cloudflare Workers** — `wrangler.jsonc` is already configured. `bunx wrangler deploy`.
- **Vercel / Netlify** — point at the repo, framework preset = *Vite*, build command `bun run build`, output `.output/public`.
- **Self-hosted Node** — `bun run build && node .output/server/index.mjs`.

Add the same env vars from step 3 to the hosting provider.

## 10. Project layout (quick map)

```
src/
  routes/              file-based routes (TanStack Router)
    __root.tsx         shell + providers
    index.tsx          landing page
    admin.*.tsx        admin dashboard
    staff.*.tsx        staff dashboard
    app.*.tsx          authenticated user area
  components/          UI primitives (shadcn/ui) + app components
  integrations/supabase/   auto-generated clients (do not edit)
  styles.css           Tailwind v4 tokens + animations
supabase/
  migrations/          ordered SQL — single source of truth for the DB
  config.toml          Supabase project settings
```

## 11. What's NOT portable

- The **Lovable AI Gateway** key (`LOVABLE_API_KEY`) only works on Lovable infra. If you move off Lovable, swap the model calls for direct OpenAI / Gemini / Anthropic keys.
- The Lovable in-editor "publish" button. Use your host's deploy flow instead.

---

Questions? Open `MIGRATION_GUIDE.md` issues in your repo, or keep the Lovable project open in parallel as a reference.
