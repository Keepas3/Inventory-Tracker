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

## Design notes

- **Money is stored as integer cents** to avoid floating-point drift.
- **Alert rules are pure functions** (`src/lib/inventory.ts`) with unit tests, separate from the UI and DB.
- **One validation schema** (`itemInputSchema`) serves form input today and will validate AI-extracted items next, so model output is never trusted blindly.
- **Same DB code for dev and prod:** a local SQLite file in dev, Turso (libSQL) via `DATABASE_URL` / `DATABASE_AUTH_TOKEN` in production.

## Roadmap

- [x] **Phase 1: Foundation.** CRUD, search/filter/sort, stats dashboard, quantity controls.
- [x] **Phase 3 (partial): Alerts.** Low stock, expiring, and warranty badges plus a "needs attention" panel.
- [ ] **Phase 2: AI capture.** Photo/receipt to structured items via Claude vision, with a review-and-confirm step. Natural-language Q&A using tool calls against the DB.
- [ ] **Phase 3: Notifications.** Scheduled email/push digests, restock suggestions from usage history, spend charts.
- [ ] **Phase 4: Ship it.** Auth, a seeded read-only public demo mode, rate-limited AI endpoints, CI (GitHub Actions), and Vercel + Turso deployment.
