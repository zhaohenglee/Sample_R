# Personal Finance

Single user app that pulls transactions from your banks through Plaid and stores them in your own Postgres. See `PLAN.md` for the roadmap.

**Status:** Phase 0 and Phase 1 done (setup, Plaid Link, transaction sync, transaction list with category editing, dashboard totals).

## Run locally

1. Copy `.env.example` to `.env` and fill in:
   - `PLAID_CLIENT_ID`, `PLAID_SECRET` from the Plaid dashboard (Sandbox secret first).
   - `TOKEN_ENCRYPTION_KEY`: `openssl rand -hex 32`
   - `SYNC_SECRET`: `openssl rand -hex 24`
   - `APP_PASSWORD`: whatever you want to log in with.
2. Start Postgres: `docker compose up -d db`
3. Install and migrate: `npm install && npm run db:migrate`
   For tests: create a `finance_test` database, copy `.env.test.example` to `.env.test`, and run `DATABASE_URL=postgres://finance:finance@localhost:5432/finance_test npm run db:migrate` then `npm test`.
4. Run: `npm run dev` and open http://localhost:3000

In Sandbox, click **Link a bank**, pick any institution, and log in with `user_good` / `pass_good`.

## Run on a server

```
cp .env.example .env   # fill in values, set PLAID_ENV=production when ready
docker compose up -d --build
```

The app listens on `127.0.0.1:3000`. Put Caddy or nginx in front with HTTPS, or reach it over Tailscale. The `sync` container calls `/api/sync` every 6 hours. Migrations run automatically on app start.

## Useful commands

| Command | What it does |
|---|---|
| `npm run sync` | Sync all linked items from the command line |
| `npm run db:generate` | Create a new migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database |
| `curl -X POST -H "Authorization: Bearer $SYNC_SECRET" localhost:3000/api/sync` | Trigger a sync (what cron does) |

## Layout

```
src/db/schema.ts        tables
src/lib/plaid.ts        Plaid client
src/lib/sync.ts         /transactions/sync loop, pending to posted handling
src/lib/crypto.ts       AES-256-GCM for access tokens
src/lib/auth.ts         password login and sync secret check
src/app/api/plaid/*     link-token, exchange, webhook
src/app/api/sync        cron entry point
src/app/page.tsx        dashboard
src/app/transactions    filterable list with inline category edit
```

## Before linking real banks

- Set `PLAID_ENV=production` and the production secret.
- Serve over HTTPS or a private network. Never expose port 3000 publicly without auth in front.
- Add webhook JWT verification in `src/app/api/plaid/webhook/route.ts` if you enable webhooks.
- Back up Postgres nightly: `docker compose exec db pg_dump -U finance finance | gzip > backup.sql.gz`
