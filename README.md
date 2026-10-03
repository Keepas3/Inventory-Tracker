# Stockpile

An AI-assisted inventory tracker I built to manage my own stuff: household supplies, electronics, and home-lab gear. It tracks what I own, flags what's running low, and warns before things expire or warranties lapse.

**Stack:** Next.js (App Router, Server Actions) · TypeScript · Tailwind · Drizzle ORM · libSQL/SQLite · Zod · Vitest

## Run locally

```bash
npm install
npm run db:push   # create the SQLite schema (local.db)
npm run db:seed   # load sample data
npm run dev       # http://localhost:3000
```

Other scripts: `npm test`, `npm run typecheck`, `npm run lint`.

## AI features

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Without it the app works normally and the AI pages show a notice.

- **Scan** (`/scan`): a photo or receipt goes to Claude (vision + structured output validated by a Zod schema). The result lands in an editable review table, and nothing is saved until you confirm. Each row is re-validated server-side by the same schema as the manual form.
- **Ask** (`/ask`): Claude answers questions by calling read-only tools (`search_items`, `items_needing_attention`, `inventory_summary`, ...) against the database, so answers come from real data rather than guesses.
- **Guardrails:** API key stays server-side, uploads are type/size-checked (and downscaled in the browser), per-IP rate limits cap spend, tools are read-only, item text is treated as data rather than instructions, and refusals/API errors surface as friendly messages. Refusal fallbacks are enabled server-side.

## Design notes

- **Money is stored as integer cents** to avoid floating-point drift.
- **Alert rules are pure functions** (`src/lib/inventory.ts`) with unit tests, separate from the UI and DB.
- **One validation schema** (`itemInputSchema`) serves form input today and will validate AI-extracted items next, so model output is never trusted blindly.
- **Same DB code for dev and prod:** a local SQLite file in dev, Turso (libSQL) via `DATABASE_URL` / `DATABASE_AUTH_TOKEN` in production.

## Roadmap

- [x] **Phase 1: Foundation.** CRUD, search/filter/sort, stats dashboard, quantity controls.
- [x] **Phase 3 (partial): Alerts.** Low stock, expiring, and warranty badges plus a "needs attention" panel.
- [x] **Phase 2: AI capture.** Photo/receipt to structured items via Claude vision, with a review-and-confirm step. Natural-language Q&A using tool calls against the DB.
- [ ] **Phase 3: Notifications.** Scheduled email/push digests, restock suggestions from usage history, spend charts.
- [ ] **Phase 4: Ship it.** Auth, a seeded read-only public demo mode, rate-limited AI endpoints, CI (GitHub Actions), and Vercel + Turso deployment.
