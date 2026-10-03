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

## Insights and weekly digest

- **History log:** every +/−, edit and creation writes an append-only `item_events` row. Taps on an empty item aren't logged, so they can't fake usage.
- **Restock suggestions** (`src/lib/analytics.ts`, pure and unit-tested): usage rate = units consumed over a 90-day window, with a one-week floor on the observation span so a single early tap doesn't spike the rate. An item is suggested when it's below its alert level or projected to run out within 14 days, sized to cover 30 days.
- **Spend charts:** by month (using the originally purchased quantity, not what's left) and current stock value by category. Plain accessible CSS bars with the numbers as text, no chart library.
- **Weekly digest:** `GET /api/cron/digest` is scheduled in `vercel.json` (Mondays 14:00 UTC). It fails closed (401 unless `Authorization: Bearer $CRON_SECRET` matches, compared in constant time), builds a deterministic digest (attention items plus shopping list, with user text HTML-escaped), and emails it via Resend if configured. `?dry=1` returns it without sending, and an empty digest is never sent.

## Design notes

- **Money is stored as integer cents** to avoid floating-point drift.
- **Alert rules are pure functions** (`src/lib/inventory.ts`) with unit tests, separate from the UI and DB.
- **One validation schema** (`itemInputSchema`) serves form input today and will validate AI-extracted items next, so model output is never trusted blindly.
- **Same DB code for dev and prod:** a local SQLite file in dev, Turso (libSQL) via `DATABASE_URL` / `DATABASE_AUTH_TOKEN` in production.

## Roadmap

- [x] **Phase 1: Foundation.** CRUD, search/filter/sort, stats dashboard, quantity controls.
- [x] **Phase 3 (partial): Alerts.** Low stock, expiring, and warranty badges plus a "needs attention" panel.
- [x] **Phase 2: AI capture.** Photo/receipt to structured items via Claude vision, with a review-and-confirm step. Natural-language Q&A using tool calls against the DB.
- [x] **Phase 3: Insights and digests.** Quantity history log, restock suggestions from real usage rates, spend charts, and a weekly digest endpoint.
- [ ] **Phase 4: Ship it.** Auth, a seeded read-only public demo mode, rate-limited AI endpoints, CI (GitHub Actions), and Vercel + Turso deployment.
