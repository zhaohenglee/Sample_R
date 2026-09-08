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

## Phase 6

Ordering is deliberate. T6.2 lays the foundation for non-Plaid data, so it
goes first and T6.1 builds on it. T6.3 is deferred: it needs live Plaid
calls to verify and the build environment cannot reach Plaid.

### Decision: manual data reuses the existing tables (lead, T6.2)

Manual accounts do **not** get their own tables. A separate `manual_accounts`
table would force a union into every query that touches accounts, which today
means the dashboard, transactions, budgets, reports, charts, and recurring.
That blast radius is not worth the tidiness. Instead:

- `items.plaid_item_id` and `items.access_token_enc` become nullable. A manual
  item has both null. Postgres allows many nulls under a unique index, so the
  existing constraint still holds for Plaid items.
- `accounts.plaid_account_id` becomes nullable, same reasoning.
- `transactions.plaid_transaction_id` stays **not null and unique**. Manual and
  imported rows get a synthetic id of the form `manual:<uuid>` or `csv:<uuid>`.
  This keeps the sync upsert logic untouched.
- A `source` column (`plaid` | `manual` | `csv`, default `plaid`) is added to
  both `accounts` and `transactions`. Sync must filter on it.

Every task below inherits this decision.

### T6.2 Manual accounts and transactions
**Scope:** Schema per the decision above. Page `/accounts` gains "Add manual
account" (name, type, subtype, starting balance, currency). Manual accounts can
be renamed, hidden, excluded from totals, and deleted (cascades transactions,
with a typed confirmation). On `/transactions`, an "Add transaction" button
opens a form (account limited to manual accounts, date, description, amount,
inflow/outflow toggle, category, notes). Manual transactions are editable and
deletable in full, unlike Plaid rows.
**Files:** schema + migration, `src/lib/manual.ts`, `src/app/api/accounts/route.ts`
(POST), `src/app/api/accounts/[id]/route.ts` (DELETE), `src/app/api/transactions/route.ts`
(POST), `src/app/api/transactions/[id]/route.ts` (DELETE), `src/components/ManualAccountForm.tsx`,
`src/components/ManualTransactionForm.tsx`, accounts and transactions pages.
**Accept:**
- `syncAllItems` skips items with a null access token and never reads or writes
  rows where `source` is not `plaid`. Test this directly: create a manual item
  and account, run a sync, assert nothing changed and no error was logged.
- Amount sign follows the existing Plaid convention, positive is money out. The
  form's inflow/outflow toggle handles the flip. Test both directions.
- A manual account's balance appears in net balance unless excluded.
- Deleting a manual account removes its transactions and leaves Plaid data intact.
- DELETE on a Plaid transaction returns 400, not a deletion.
- Manual transactions are picked up by budgets, reports, and charts.

### T6.1 CSV import
**Scope:** Page `/import`. Upload a CSV (cap 5 MB, 10000 rows), pick the target
account (manual accounts only), then a mapping screen: date column and format,
description column, amount column, plus a sign convention toggle (positive is
spending, or positive is income) and an optional separate debit/credit column
pair. Show a 10 row preview with parsed results and per-row errors. Import
inserts with `source = 'csv'` and id `csv:<uuid>`. Dedupe within the account on
a hash of date, amount, and normalized description; report how many rows were
skipped as duplicates. Category rules run on imported rows.
**Files:** `src/lib/csv.ts` (parser and mapper, no dependency beyond a small
hand written RFC 4180 splitter), `src/app/import/page.tsx`,
`src/app/api/import/preview/route.ts`, `src/app/api/import/commit/route.ts`,
`src/components/ImportWizard.tsx`, nav link.
**Accept:**
- Parser unit tests: quoted fields, embedded commas, embedded newlines, escaped
  quotes, CRLF, a UTF-8 byte order mark, and a trailing blank line.
- Date parsing covers ISO, US, and European orders, chosen explicitly by the
  user rather than guessed.
- Amounts parse with currency symbols, thousands separators, and parentheses
  for negatives.
- Re-importing the same file a second time inserts zero rows.
- A malformed row is reported with its line number and does not abort the import.
- Over-size or over-row-count uploads are rejected with 413.

### T6.4 Export
**Scope:** `GET /api/export/transactions.csv` accepting the same query
parameters as the transactions page, streaming a CSV with a header row.
`GET /api/export/backup.json` dumping every table for offline backup. Buttons on
the transactions page and `/accounts`. Both require auth.
**Files:** `src/lib/export.ts`, `src/app/api/export/transactions.csv/route.ts`,
`src/app/api/export/backup.json/route.ts`, UI buttons.
**Accept:**
- Exported rows match the filtered page exactly, same order, same count.
- Fields containing commas, quotes, or newlines are correctly escaped and
  round trip through the T6.1 parser.
- Access tokens never appear in the JSON backup. Assert this in a test.
- Unauthenticated requests get 401.

### T6.5 Goals
**Scope:** Table `goals` (`id, name, account_id nullable, target_amount,
target_date nullable, created_at`). Page `/goals` for CRUD. Progress is the
linked account's current balance against the target, or a manual current amount
when no account is linked. Dashboard card shows active goals with a progress bar
and, where a target date exists, the monthly saving required to hit it.
**Files:** schema + migration, `src/lib/goals.ts`, `src/app/goals/page.tsx`,
`src/app/api/goals/route.ts`, `src/app/api/goals/[id]/route.ts`, dashboard card, nav link.
**Accept:**
- Pure function for required monthly contribution, unit tested, including a past
  target date and an already met goal.
- Deleting a linked account nulls the goal's `account_id` rather than deleting
  the goal.
- Progress is capped at 100 percent in the display.

### T6.3 Investments and liabilities (deferred)
Blocked. Verifying it needs live Plaid `investments` and `liabilities` calls,
and the build environment's network policy denies Plaid. Build this once the app
is deployed somewhere with outbound access, or once the policy is changed.
