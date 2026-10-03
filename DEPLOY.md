# Deploying Stockpile

Recommended setup for a portfolio: **one public read-only demo** (seeded fake data, no login) on Vercel with a Turso database. Optionally run a second, private deployment for your real inventory.

> I haven't deployed this from the dev machine, so treat the steps below as a checklist to verify as you go.

## 1. Database (Turso)

```bash
turso db create stockpile-demo
turso db show stockpile-demo --url          # -> DATABASE_URL (libsql://...)
turso db tokens create stockpile-demo       # -> DATABASE_AUTH_TOKEN
```

Create the schema and load the sample data (the seed wipes the target DB, so it refuses non-local databases unless you confirm):

```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:push
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... SEED_CONFIRM=yes npm run db:seed
```

(PowerShell: set `$env:DATABASE_URL=...` etc. first.) Use a **separate database for each deployment**, and never run the seed against the one holding your real data.

## 2. Vercel project: public demo

Import the GitHub repo, then set these environment variables:

| Variable | Value |
|---|---|
| `APP_MODE` | `demo` |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | from step 1 |
| `ANTHROPIC_API_KEY` | a key **dedicated to this deployment** |
| `AI_DAILY_LIMIT` | e.g. `100`, the global ceiling on AI calls per day |
| `CRON_SECRET` | `openssl rand -hex 32` (both cron endpoints refuse everything without it) |
| `NEXT_PUBLIC_AUTHOR_NAME`, `NEXT_PUBLIC_PORTFOLIO_URL` | optional, shows a "built by" credit in the footer |

Demo mode is read-only for everyone (writes are rejected server-side, not just hidden). Ask and Scan stay available with tight per-visitor limits; scanned items are shown but never saved.

**Daily refresh:** `vercel.json` schedules `/api/cron/refresh-demo` (06:00 UTC). It regenerates the whole demo dataset relative to today, so "expires in 12 days" and the usage charts never go stale. It is **destructive**, so it only runs when `APP_MODE=demo` (anything else gets a 403) and needs `CRON_SECRET`. On a private deployment the cron simply receives that 403 and does nothing. Never set `APP_MODE=demo` on a deployment that holds real data.

## 3. Optional: private deployment (your real data)

A second Vercel project from the same repo, with its own Turso DB:

| Variable | Value |
|---|---|
| `APP_MODE` | `private` (or omit) |
| `AUTH_PASSWORD` | a long passphrase |
| `SESSION_SECRET` | `openssl rand -hex 32` (≥ 32 chars) |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `CRON_SECRET` | as above |
| `RESEND_API_KEY`, `DIGEST_TO`, `DIGEST_FROM` | optional, to email the weekly digest |

If a production deployment is missing its auth config, it **locks itself** (503 on every route) instead of falling open.

## Cost and abuse protection: read this

- Per-visitor and global AI limits are held **in memory**, so on serverless they are per-instance and reset on cold starts. They blunt abuse but are not a hard cap.
- **Set a monthly spend limit on the Anthropic workspace** that owns the demo key. That is the real ceiling.
- Rotate the key if it ever appears in a log, screenshot or commit. `.env*` is git-ignored; only `.env.example` is tracked.

## What CI checks

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, a production build and `npm audit` (high+, production deps) on every push and PR. It needs no secrets.
