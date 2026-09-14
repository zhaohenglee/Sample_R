# Personal Finance App with Plaid: Build Plan

Single user, self hosted app that pulls transactions from your banks through Plaid, stores them locally, and gives you budgeting, categorization, and reporting on top.

## 1. Goals and scope

**In scope (v1)**
- Link checking, savings, and credit card accounts through Plaid.
- Sync transactions automatically and keep them in your own database.
- Clean, editable categories and merchant names.
- Monthly budgets with actual vs plan.
- Dashboard: net cash flow, spend by category, balances, recurring bills.

**Later (v2+)**
- Investments and loans (Plaid Investments and Liabilities products).
- Manual accounts (cash, property) and CSV import for banks Plaid cannot reach.
- Rules engine for auto categorization, split transactions, goals.

**Out of scope**
- Multi user, payments, moving money.

## 2. Plaid essentials you must design around

| Concept | What it means for you |
|---|---|
| Environments | Build against **Sandbox** (fake data, free). Switch to **Production** for your real banks. Personal / limited use keys cover a small number of linked institutions, which is enough for one person. |
| Item | One login at one bank. Each Item yields one `access_token`. Store it encrypted, never in the browser. |
| Link flow | Server creates a `link_token` → browser opens Plaid Link → you get a `public_token` → server exchanges it for `access_token` + `item_id`. |
| Transactions | Use `/transactions/sync` with a stored cursor per Item. It returns `added`, `modified`, `removed`. Never use the old `/transactions/get` pagination. |
| Pending → posted | A pending transaction is later removed and replaced by a posted one with a new id. Your upsert logic must handle `removed` and keep any manual edits by matching `pending_transaction_id`. |
| Categories | Plaid returns `personal_finance_category` (primary + detailed). Map these to your own category table and let your edits win. |
| Webhooks | `SYNC_UPDATES_AVAILABLE` tells you to run sync. For a personal app a scheduled sync every few hours is fine as a fallback or replacement. |
| Item errors | `ITEM_LOGIN_REQUIRED` means the bank needs re auth. Surface it in the UI and reopen Link in update mode. |
| Balances | `/accounts/balance/get` is real time but slow and billed separately. Use the balances returned with sync for display and only call balance on demand. |

## 3. Recommended stack

Pick boring tools you can run on a laptop or a small VPS.

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (TypeScript), App Router | One codebase for API routes and UI. Official `plaid` npm SDK. |
| DB | PostgreSQL (SQLite acceptable for local only) | Strong types, easy reporting queries. |
| ORM | Drizzle or Prisma | Migrations and typed queries. |
| Jobs | Cron hitting an internal `/api/sync` route, or a tiny worker | Scheduled sync without extra infra. |
| Auth | Single password plus session cookie, or Cloudflare Access / Tailscale in front | It is your money data. Do not expose it unauthenticated. |
| Secrets | `.env` locally, Docker secrets or VPS env in prod | Plaid client id, secret, and a 32 byte key for encrypting access tokens. |
| Deploy | Docker Compose on a VPS, or run locally | Simple and private. |

Alternative if you prefer Python: FastAPI + SQLAlchemy + HTMX or a small React front end. Same data model and phases apply.

## 4. Data model

```
institutions   id, plaid_institution_id, name, logo
items          id, plaid_item_id, institution_id, access_token_enc, cursor,
               status (ok | login_required | error), last_synced_at
accounts       id, item_id, plaid_account_id, name, official_name, mask,
               type, subtype, current_balance, available_balance, currency, hidden
transactions   id, account_id, plaid_transaction_id, pending_transaction_id,
               date, authorized_date, amount, currency, merchant_name, name,
               plaid_category_primary, plaid_category_detailed,
               category_id (your own), notes, is_pending, is_removed,
               user_edited (bool), created_at, updated_at
categories     id, name, parent_id, budget_group, icon
category_rules id, match_field, pattern, category_id, priority
budgets        id, category_id, month, amount
recurring      id, merchant_key, cadence, expected_amount, next_due (derived)
sync_log       id, item_id, started_at, finished_at, added, modified, removed, error
```

Rules:
- Plaid amounts are positive for money out. Store as given and flip in the UI, or normalize once on write. Choose one and document it.
- Keep `user_edited` so a later sync never overwrites a category or merchant you fixed by hand.
- Soft delete with `is_removed` instead of hard delete, so history and audits stay intact.

## 5. Phases

**Phase 0: Setup (half a day)**
- Repo scaffold, Postgres via Docker, `.env` with Plaid Sandbox keys.
- Migrations for the tables above.

**Phase 1: Link and sync (1 to 2 days)**
- `POST /api/plaid/link-token`, `POST /api/plaid/exchange`.
- Link button in the UI, store Item and accounts.
- `POST /api/sync` runs `/transactions/sync` for every Item until `has_more` is false, applies added / modified / removed, saves cursor.
- Test with Sandbox test users, including the pending to posted transition.

**Phase 2: Transactions UI (1 to 2 days)**
- Paginated list with filters: account, date range, category, search.
- Inline edit of category, merchant, notes. Sets `user_edited`.
- Default category mapping from Plaid PFC to your categories.

**Phase 3: Categorization rules (1 day)**
- Rules table and a simple matcher (contains / regex on merchant or name).
- Apply rules on sync for new transactions only. "Apply to past" button.

**Phase 4: Budgets and dashboard (2 days)**
- Monthly budget per category, actual vs plan, remaining.
- Charts: spend by category, cash flow by month, balance trend.
- Recurring detection: same merchant, similar amount, regular cadence.

**Phase 5: Hardening and production (1 day)**
- Encrypt access tokens at rest. Add auth in front of the app.
- Webhook endpoint with signature verification, or a cron schedule.
- Item error handling and Link update mode.
- Backups: nightly `pg_dump` to encrypted storage.
- Switch to Production keys and link your real accounts.

**Phase 6: Extras (ongoing)**
- CSV import, manual accounts, investments, goals, exports.

## 6. Security checklist

- Never send `access_token` to the browser. Only `link_token` goes client side.
- Encrypt access tokens with a key kept outside the database.
- Put the app behind auth or a private network before linking real banks.
- Verify Plaid webhook JWTs before trusting a payload.
- Rotate Plaid secrets if a laptop or server is lost.
- Keep the database out of git and back it up.

## 7. Decisions to make before coding

1. TypeScript / Next.js or Python? (Recommendation: Next.js, single codebase.)
2. Run only on your laptop, or deploy to a VPS so sync happens while you sleep?
3. Webhooks (needs a public URL) or scheduled polling? (Polling every 6 hours is enough for personal use.)
4. Amount sign convention in the database.
5. Do you want your own category tree, or start with Plaid's and rename later?
