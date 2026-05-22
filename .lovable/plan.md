# Mukuba University Online Suggestion Box

Building on TanStack Start + Lovable Cloud (Postgres, Auth, Storage, Edge runtime, AI Gateway). All features from your spec delivered; stack swapped to what Lovable runs natively.

## Visual direction (locked from your screenshot)

- **Palette**: deep navy base (`#0b1a3a` → `#0f2a4d` gradient), soft off-white surfaces (`#f5f7fb`), **emerald → teal accent** (`#10b981` → `#14b8a6`), gold reserved for status highlights
- **Typography**: serif display for headlines (Instrument Serif / Fraunces) with the two-line color split ("Your Voice." white / "Your University." emerald-to-teal gradient), clean sans (Inter) for body and UI
- **Surfaces**: light top bar with subtle border, dark navy hero with radial gradient glow, white content sections below, generous spacing
- **Buttons**: solid emerald primary with arrow, ghost outlined secondary; rounded-lg
- **Motion**: subtle fade-up on scroll, count-up stats, smooth dark/light toggle
- **Pill badge** above hero headline ("Mukuba University — Official Platform")
- Consistent across landing, auth, dashboard, admin — admin uses dark navy chrome with emerald accents (Linear-style command bar, NOT generic sidebar)

## Stack mapping

| Spec | Built with |
|---|---|
| Next.js / React / TS / Tailwind / Framer Motion / shadcn | TanStack Start + React 19 + TS + Tailwind v4 + Framer Motion + shadcn |
| Node/Express APIs | `createServerFn` + server routes |
| Postgres + Prisma | Lovable Cloud Postgres |
| JWT + RBAC | Cloud Auth + `user_roles` table + `has_role()` |
| File storage | Cloud Storage |
| Realtime | Cloud Realtime (Postgres channels) |
| Email | Lovable Emails (Resend) |
| OpenAI NLP | Lovable AI Gateway (Gemini default) |
| Tests | Vitest |

## Build order

### 1. Foundation
- Enable Lovable Cloud + `LOVABLE_API_KEY`
- Wire `attachSupabaseAuth` in `src/start.ts`
- Theme tokens in `src/styles.css` (navy/emerald/teal, serif+sans, radii)
- Root layout: header, footer, theme toggle, Toaster, QueryClient, auth listener
- Route guards: `_authenticated`, `_admin` (via `has_role`)

### 2. Database (migrations + RLS)
- `app_role` enum: student | staff | stakeholder | admin | super_admin
- `profiles` (name, student_id, university_email, department_id, status: pending/approved/banned)
- `user_roles` (separate table — security best practice)
- `departments`, `categories` (Academics, Hostel, Cafeteria, Security, Administration, ICT, Infrastructure, Sports, Other)
- `suggestions` (title, body, category, dept, priority, status, anonymous, sentiment, spam_score, embedding vector, duplicate_of, tags[], upvotes)
- `attachments`, `responses` (with internal-note flag), `upvotes`
- `mass_replies` + `mass_reply_targets` (mass-reply audit + fan-out)
- `notifications`, `activity_logs`
- Storage bucket `suggestion-attachments` (private, RLS)
- `has_role()` security-definer fn for non-recursive RLS

### 3. Auth
- Email/password + Google (Lovable broker)
- Signup captures student ID + university email → status `pending`
- Forgot + dedicated `/reset-password` page
- Email verification + welcome email

### 4. Public site (separate routes, each with own `head()`)
- `/` — hero (matches screenshot), how-it-works timeline, feature grid, stats, testimonials, FAQ, CTA, footer
- `/about`, `/how-it-works`, `/transparency`, `/faq`, `/contact`
- `/transparency` — resolved-suggestions feed + monthly metrics + response-time charts

### 5. Student/staff app
- `/_authenticated/submit` — multi-step form (category → dept → title/body → priority → attachments → anonymous → review). Before final submit, **similar-suggestions check** via embeddings: "Is this the same as…?"
- `/_authenticated/my-suggestions` — cards with status, filters, search
- `/_authenticated/suggestions/$id` — status timeline, threaded responses, attachments, upvote
- Realtime updates + notification bell

### 6. Admin (centerpiece — NOT a generic sidebar)
Top command bar + contextual side rail + spacious canvas.
- **Overview** — animated metric cards, Recharts (submissions trend, category donut, dept heatmap, avg response time, resolution funnel), live activity feed
- **Inbox** — Kanban + table hybrid; drag across status columns; bulk select
- **Similar-suggestion grouping** ⭐ — server fn embeds each suggestion (Lovable AI `gemini-embedding-001`), cosine-clusters; admin merges clusters (others become `duplicate_of`)
- **Mass reply** ⭐ — admin filters (category/status/dept/date/keyword/cluster) → preview recipient count → compose → one server fn writes `mass_replies` + N `responses` + N notifications + N emails; filter snapshot saved
- **Users** — approve/reject pending, assign roles, ban
- **Departments**, **Reports** (CSV/PDF export), **Moderation queue**, **Audit log**

### 7. AI (all server-side, Lovable AI Gateway)
- Sentiment, spam score, auto-tags, smart category, embeddings + duplicate detection, nightly trend detection (cron via `/api/public/cron/trends`)
- Default model `google/gemini-3-flash-preview`; mass-reply drafting can use `openai/gpt-5-mini`

### 8. Notifications & email
- In-app bell + sonner toasts + realtime
- Email on status change, response, mass reply, approval

### 9. Polish
- Skeletons, empty states, error boundaries on every route
- Framer Motion page transitions, hover micro-interactions, count-up stats
- Mobile bottom nav for authenticated users
- WCAG AA, focus rings, ARIA, keyboard nav
- SEO per-route, `llms.txt`, JSON-LD on landing

### 10. Verification
- Vitest tests for critical server fns (role checks, mass-reply batching, similarity)
- Manual QA: signup → submit → admin reply → mass reply → transparency

## Security
- All sensitive logic in `createServerFn` with `requireSupabaseAuth` + role checks
- `supabaseAdmin` only for trusted admin fan-outs (mass reply, approvals)
- Roles ONLY in `user_roles` (never on profiles)
- Zod validation on every server fn
- File-upload mime + size validation
- Webhooks/cron under `/api/public/*`

## Deliverables
Complete, connected, production-ready app — migrations, RLS, buckets, server fns, all UI, all AI integrations, seeded reference data (departments, categories, demo admin). No placeholders.

Expect several follow-up turns for refinement after the first build pass.