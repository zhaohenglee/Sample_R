# Personal Finance

Single user app that pulls transactions from your banks through Plaid and stores them in your own Postgres. See `PLAN.md` for the roadmap.

**Status:** Phases 0 to 4 done: setup, Plaid Link and sync, categories, transaction editing, accounts, rules engine with safe regex, budgets, dashboard charts, recurring detection. Next: Phase 5 hardening (webhook verification, auth, ops, CI).

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

## Operations

- `GET /api/health` runs `select 1` against the database with a 3 second budget and returns `200 { ok: true, db: true }`, or `503 { ok: false, db: false }` if the database is unreachable. Unauthenticated, no secrets in the body. `docker compose` uses it for the `app` service healthcheck.
- `/sync` shows the last 50 sync runs (per bank item, with duration and any error) plus a summary of every linked item's status, and has a "Sync now" button.
- The `backup` compose service runs `scripts/backup.sh` once on start and then every 24 hours: a gzipped `pg_dump` written to `./backups/finance-<timestamp>.sql.gz`, pruning dumps older than `RETENTION_DAYS` (default 14). Run it manually with `docker compose exec backup /scripts/backup.sh` or `./scripts/backup.sh` locally (needs `pg_dump` on `PATH` and `PG*` env vars, or edit `BACKUP_DIR`).

### Restore a backup

Dumps are written with `pg_dump --clean --if-exists`, so the SQL includes
`DROP` statements for existing objects before recreating them -- the restore
can run straight over a live database, not just an empty one. `-v
ON_ERROR_STOP=1` makes `psql` stop (and exit non-zero) on the first error
instead of plowing ahead:

```
gunzip -c backups/finance-20260101-030000.sql.gz | docker compose exec -T db psql -v ON_ERROR_STOP=1 -U finance finance
```

## Before linking real banks

- Set `PLAID_ENV=production` and the production secret.
- Serve over HTTPS or a private network. Never expose port 3000 publicly without auth in front.
- Add webhook JWT verification in `src/app/api/plaid/webhook/route.ts` if you enable webhooks.
- Back up Postgres nightly: the `backup` compose service does this automatically (see Operations above).
