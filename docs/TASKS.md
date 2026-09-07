# Detailed Task Plan

Each task is one commit. Each task has a scope, files, and acceptance criteria. The builder implements against the criteria. The validator checks them. See `docs/BUILD-PROCESS.md` for the roles.

Conventions for every task:
- Tests need `.env.test` pointing at a database whose name ends in `_test` (copy `.env.test.example`). The suite refuses anything else.
- `npm run typecheck`, `npm run build`, and `npm test` must pass.
- Schema changes go in `src/db/schema.ts` followed by `npm run db:generate`. Commit the migration.
- Server components read from the DB directly. Mutations go through `src/app/api/*` route handlers guarded by `requireAuthApi()`.
- Keep the visual style of the existing pages (Tailwind, white cards on gray, small tables).

---

## Phase 2: Categories and transaction management

### T2.0 Test harness
**Scope:** Add Vitest. Move the sync integration test into `tests/sync.test.ts`. Tests run against `DATABASE_URL` from `.env.test` (falls back to `.env`). Each test truncates the tables it touches.
**Files:** `vitest.config.ts`, `tests/setup.ts`, `tests/sync.test.ts`, `package.json` (`"test": "vitest run"`), `.env.test.example`.
**Accept:**
- `npm test` passes against a fresh database with migrations applied.
- Tests cover: crypto round trip, PFC default category mapping, user edit preserved on modified, pending to posted inherits edits, removed marks `is_removed`, cascade delete on item.

### T2.1 Category management
**Scope:** Page `/categories` to list, create, rename, delete categories, and set the Plaid primary mapping. Deleting a category sets `transactions.category_id` to null for its rows (confirm dialog). Support one level of nesting via `parent_id`, shown as group headers.
**Files:** `src/app/categories/page.tsx`, `src/app/api/categories/route.ts` (GET, POST), `src/app/api/categories/[id]/route.ts` (PATCH, DELETE), `src/components/CategoryEditor.tsx`, nav link in `layout.tsx`.
**Accept:**
- Create, rename, reparent, delete all work from the UI and via API.
- Plaid primary mapping is editable. Two categories cannot claim the same primary (409 on conflict).
- Deleting a parent moves its children to top level.
- Unit test for the DELETE null out behavior.

### T2.2 Transaction editing and bulk actions
**Scope:** Add `display_name` (text, nullable) to `transactions`. On the transactions page: click a row to open an edit panel with display name, category, notes. Add checkboxes with a bulk bar: set category for selected. Add a "split" placeholder? No. Keep out of scope.
**Files:** schema + migration, `src/app/api/transactions/[id]/route.ts` (extend PATCH), `src/app/api/transactions/bulk/route.ts` (POST `{ ids, categoryId }`), `src/components/TransactionRow.tsx`, `src/components/BulkBar.tsx`, transactions page.
**Accept:**
- Display name shows in place of merchant/name when set. Search matches display name too.
- Any edit sets `user_edited = true`. Sync never overwrites `display_name`, `notes`, or `category_id` on edited rows (extend the test).
- Bulk categorize of up to 500 ids works in one request.

### T2.3 Account and connection management
**Scope:** Page `/accounts`. Per account: rename (`nickname` column), hide toggle, include in net worth toggle (`exclude_from_totals`). Per item: "Unlink" which calls Plaid `/item/remove`, then deletes the item (cascade).
**Files:** schema + migration, `src/app/accounts/page.tsx`, `src/app/api/accounts/[id]/route.ts` (PATCH), `src/app/api/items/[id]/route.ts` (DELETE), nav link.
**Accept:**
- Dashboard and transactions list respect hidden accounts and nicknames.
- Unlink removes the item at Plaid and locally. Failure at Plaid returns 502 and leaves local data intact.
- Net balance excludes `exclude_from_totals` accounts.

---

## Phase 3: Rules engine

### T3.1 Rules storage and UI
**Scope:** Table `category_rules` (`id, name, field: name|merchant_name|any, match: contains|starts_with|regex, pattern, amount_min, amount_max, account_id nullable, category_id, set_display_name nullable, priority int, enabled bool, created_at`). Page `/rules` for CRUD with ordering by priority. Regex patterns validated server side (reject invalid, cap length 200).
**Files:** schema + migration, `src/lib/rules.ts` (types, `matchRule(rule, tx)`), `src/app/rules/page.tsx`, `src/app/api/rules/route.ts`, `src/app/api/rules/[id]/route.ts`, nav link.
**Accept:**
- CRUD works. Invalid regex returns 400.
- `matchRule` is a pure function with unit tests: each match type, amount bounds, account scoping, case insensitivity.

### T3.2 Apply rules on sync and on demand
**Scope:** In `upsertTransactions`, after inserting new rows (not on modified, not on `user_edited`), run rules in priority order; first match sets `category_id` and optionally `display_name`, and sets `rule_id` (new nullable column). Add `POST /api/rules/apply` with `{ ruleId?: number, includeEdited?: boolean }` to backfill. Show a dry run count first ("This will change N transactions"). In the transactions edit panel add "Create rule from this transaction" prefilled with merchant contains.
**Files:** `src/lib/sync.ts`, `src/lib/rules.ts` (`applyRules(txIds)`), `src/app/api/rules/apply/route.ts`, rules page, `TransactionRow.tsx`.
**Accept:**
- New synced transactions get categorized by matching rules (integration test).
- User edited rows are untouched unless `includeEdited` is true.
- Dry run returns count without writing. Apply returns count changed.
- Rule priority is respected: lower number wins (test with two overlapping rules).

---

## Phase 4: Budgets, dashboard, recurring

### T4.1 Budgets
**Scope:** Page `/budgets?month=YYYY-MM`. Table of categories with budget input and actual spend for that month, remaining, progress bar. "Copy from previous month" button. Income categories excluded from spend totals. Add a "budget_group" concept? No. Keep flat.
**Files:** `src/app/budgets/page.tsx`, `src/app/api/budgets/route.ts` (PUT upsert list, POST copy), `src/lib/reports.ts` (`spendByCategory(month)`), nav link.
**Accept:**
- Saving budgets is idempotent (upsert on category+month).
- Actuals match the transactions page filtered to the same category and month.
- Over budget rows are visually distinct.

### T4.2 Dashboard charts
**Scope:** Add `balance_snapshots` (`account_id, date, current, available`, unique on account+date), written on every sync. Dashboard gets three charts using inline SVG (no chart library): cash flow by month for the last 12 months (in vs out bars), spend by category this month (horizontal bars), net balance trend from snapshots (line). Add month selector.
**Files:** schema + migration, `src/lib/sync.ts` (snapshot write), `src/lib/reports.ts`, `src/components/charts/*.tsx`, `src/app/page.tsx`.
**Accept:**
- Charts render server side with no client JS.
- Snapshot written at most once per account per day (upsert).
- Transfers between own accounts (`TRANSFER_IN`, `TRANSFER_OUT` categories) are excluded from cash flow.

### T4.3 Recurring detection
**Scope:** `src/lib/recurring.ts`: group posted transactions by normalized merchant key (lower, strip digits and punctuation). A group is recurring when it has 3 or more occurrences with intervals within 20 percent of a monthly, weekly, or yearly cadence and amounts within 15 percent of the median. Persist into `recurring` table on sync (replace all rows). Dashboard card "Upcoming" lists the next 30 days with expected amount and next date.
**Files:** schema + migration, `src/lib/recurring.ts`, `src/lib/sync.ts` (call after sync), dashboard.
**Accept:**
- Pure detection function with unit tests: monthly rent detected, irregular coffee not detected, yearly subscription detected with 3 points.
- Dashboard shows upcoming items sorted by date.

---

## Phase 5: Hardening

### T5.1 Webhook verification
**Scope:** Verify `Plaid-Verification` JWT: fetch key via `/webhook_verification_key/get`, cache by `kid`, verify ES256 signature and body SHA-256. Reject with 401 on failure. Also handle `ITEM: PENDING_EXPIRATION` and `NEW_ACCOUNTS_AVAILABLE` by setting a status flag surfaced on `/accounts`.
**Files:** `src/lib/webhook-verify.ts`, `src/app/api/plaid/webhook/route.ts`, test with a locally generated ES256 key pair.
**Accept:**
- Valid signed request passes; tampered body fails; unknown kid fails; expired iat (over 5 minutes) fails.

### T5.2 Auth hardening
**Scope:** Login rate limit (5 failures per 15 minutes per IP, in memory). Logout button. Session cookie derived from a random `SESSION_SECRET` instead of the encryption key. `proxy.ts` (Next 16) redirects unauthenticated page requests so pages do not each call `requireAuthPage`.
**Files:** `src/lib/auth.ts`, `src/proxy.ts`, layout (logout), `.env.example`.
**Accept:**
- Sixth bad attempt within the window returns 429.
- All pages except `/login` redirect when logged out. API routes still return 401 JSON.

### T5.3 Operations
**Scope:** `GET /api/health` (checks DB). Compose healthchecks for db and app. `scripts/backup.sh` running `pg_dump` to `./backups/` with 14 day retention and an optional `backup` compose service on a daily loop. Structured sync log page `/sync` showing last 50 runs and per item errors.
**Files:** `src/app/api/health/route.ts`, `docker-compose.yml`, `scripts/backup.sh`, `src/app/sync/page.tsx`.
**Accept:**
- Health returns 200 with `{ ok: true, db: true }` and 503 when DB is down.
- Backup script produces a gzipped dump and prunes old files.

### T5.4 CI
**Scope:** GitHub Actions workflow: Postgres service, `npm ci`, migrate, typecheck, test, build.
**Files:** `.github/workflows/ci.yml`.
**Accept:** Workflow passes on the branch.

---

## Phase 6: Extras (each is independent)

### T6.1 CSV import
Manual accounts (`items.plaid_item_id` nullable, `accounts.is_manual`). Upload CSV, map columns (date, description, amount, sign convention), preview, import with dedupe on (account, date, amount, description hash). Rules run on imported rows.

### T6.2 Manual transactions and accounts
Create manual account (cash, property). Add, edit, delete manual transactions. Manual balance updates create snapshots.

### T6.3 Investments and liabilities
Enable Plaid `investments` and `liabilities` products. Holdings table and page. Liabilities (credit APR, next payment due) shown on `/accounts`.

### T6.4 Export
`GET /api/export/transactions.csv` with the same filters as the transactions page. Full JSON export of all tables for backup.

### T6.5 Goals
Savings goals linked to an account with target amount and date, progress on dashboard.
