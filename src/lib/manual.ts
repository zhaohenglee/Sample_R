import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "./categories";
import { currentDateIso } from "./reports";

const { items, accounts, transactions, categories, balanceSnapshots } = schema;

// Kept in sync with the manual-account form's <select> options. Not a
// database enum -- `type` stays a free `text` column, same as the Plaid
// path, so this is just what the UI (and validation) currently offers.
export const MANUAL_ACCOUNT_TYPES = ["depository", "credit", "loan", "investment", "other"] as const;
export type ManualAccountType = (typeof MANUAL_ACCOUNT_TYPES)[number];

const MAX_PG_INT = 2147483647; // postgres integer column max
const MAX_NAME_LEN = 60;
const MAX_SUBTYPE_LEN = 40;
// Exported: src/lib/transactions.ts reuses this cap for the "name" field a
// non-Plaid PATCH is allowed to edit, so the two paths agree on the limit.
export const MAX_DESCRIPTION_LEN = 200;
const MAX_NOTES_LEN = 1000;
// numeric(14,2); keep well clear of that range so a value that passes our
// own check never trips a Postgres 22003 out of range error either.
// Exported so src/lib/transactions.ts's PATCH validation applies the same
// bound to a manual row's edited amount.
export const MAX_ABS_AMOUNT = 1e12;
const CURRENCY_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rejects a value with more than 2 decimal places rather than silently
// rounding it. Compares in cents with a small epsilon to tolerate ordinary
// binary-float representation error. Mirrors the equivalent check in
// src/lib/budgets.ts. Exported for reuse by src/lib/transactions.ts.
export function hasAtMostTwoDecimals(amount: number): boolean {
  return Math.abs(Math.round(amount * 100) - amount * 100) < 1e-6;
}

// Exported for reuse by src/lib/transactions.ts's PATCH validation.
export function isValidCalendarDate(raw: string): boolean {
  if (!DATE_RE.test(raw)) return false;
  const [y, m, d] = raw.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// The one place a user-entered (amount, direction) pair becomes a signed,
// Plaid-convention amount (positive = money out). Shared by
// createManualTransaction below and the non-Plaid branch of
// src/lib/transactions.ts's updateTransaction, so the two paths can never
// disagree on the conversion.
export function toPlaidSignedAmount(amount: number, direction: "in" | "out"): number {
  return direction === "out" ? amount : -amount;
}

// A minimal query-capable handle: either the module-level `db`, or a
// transaction passed down so the read, the balance write, and the snapshot
// write all happen atomically. Mirrors the equivalent `Queryable` type in
// src/lib/categories.ts and src/lib/transactions.ts.
type Queryable = Pick<typeof db, "select" | "insert" | "update">;

// Recomputes and stores a manual account's current_balance (and
// available_balance, kept equal to it -- a manual account has no separate
// credit-limit-driven "available" concept) as starting_balance minus the
// sum of amount over its non-removed transactions (Plaid sign convention:
// positive = money out). Always queries the sum fresh rather than
// incrementing a running total, so it can never drift from the ledger.
// A no-op for a Plaid account. Also upserts today's balance_snapshots row,
// so the net-balance trend chart reflects manual activity even for a user
// who has only manual accounts and never runs a sync. Call this after every
// manual transaction create, edit, or delete (and once right after creating
// the account itself, so a fresh account's first snapshot exists).
export async function recomputeManualBalance(tx: Queryable, accountId: number): Promise<void> {
  const [account] = await tx.select().from(accounts).where(eq(accounts.id, accountId));
  if (!account || account.source !== "manual") return;

  const [sumRow] = await tx
    .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.isRemoved, false)));
  const starting = parseFloat(account.startingBalance ?? "0");
  const net = parseFloat(sumRow?.total ?? "0");
  const balance = (starting - net).toFixed(2);

  await tx.update(accounts)
    .set({ currentBalance: balance, availableBalance: balance, updatedAt: new Date() })
    .where(eq(accounts.id, accountId));

  await tx.insert(balanceSnapshots).values({
    accountId,
    date: currentDateIso(),
    current: balance,
    available: balance,
  }).onConflictDoUpdate({
    target: [balanceSnapshots.accountId, balanceSnapshots.date],
    set: { current: balance, available: balance },
  });
}

// ---------------------------------------------------------------------------
// Manual account
// ---------------------------------------------------------------------------

export type ManualAccountInput = {
  name: string;
  type: ManualAccountType;
  subtype: string | null;
  startingBalance: number;
  currency: string;
};

const ACCOUNT_ALLOWED_FIELDS = new Set(["name", "type", "subtype", "startingBalance", "currency"]);

export function validateManualAccountInput(body: unknown): ManualAccountInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ACCOUNT_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  if (typeof obj.name !== "string") throw new ValidationError("name must be a string.");
  const name = obj.name.trim();
  if (name.length < 1 || name.length > MAX_NAME_LEN) {
    throw new ValidationError(`name must be between 1 and ${MAX_NAME_LEN} characters.`);
  }

  if (typeof obj.type !== "string" || !MANUAL_ACCOUNT_TYPES.includes(obj.type as ManualAccountType)) {
    throw new ValidationError(`type must be one of: ${MANUAL_ACCOUNT_TYPES.join(", ")}.`);
  }
  const type = obj.type as ManualAccountType;

  let subtype: string | null = null;
  if ("subtype" in obj && obj.subtype !== null && obj.subtype !== undefined) {
    if (typeof obj.subtype !== "string") throw new ValidationError("subtype must be a string or null.");
    const trimmed = obj.subtype.trim();
    if (trimmed.length > MAX_SUBTYPE_LEN) {
      throw new ValidationError(`subtype must be at most ${MAX_SUBTYPE_LEN} characters.`);
    }
    subtype = trimmed || null;
  }

  if (typeof obj.startingBalance !== "number" || !Number.isFinite(obj.startingBalance)) {
    throw new ValidationError("startingBalance must be a finite number.");
  }
  if (Math.abs(obj.startingBalance) > MAX_ABS_AMOUNT || !hasAtMostTwoDecimals(obj.startingBalance)) {
    throw new ValidationError("startingBalance must have at most 2 decimal places and be a reasonable amount.");
  }

  let currency = "USD";
  if ("currency" in obj && obj.currency !== null && obj.currency !== undefined) {
    if (typeof obj.currency !== "string") throw new ValidationError("currency must be a string.");
    const trimmed = obj.currency.trim().toUpperCase();
    if (trimmed) {
      if (!CURRENCY_RE.test(trimmed)) throw new ValidationError("currency must be a 3-letter code, e.g. USD.");
      currency = trimmed;
    }
  }

  return { name, type, subtype, startingBalance: obj.startingBalance, currency };
}

export type Account = typeof accounts.$inferSelect;

// Creates the account's own dedicated "item" shell (plaid_item_id and
// access_token_enc both null, per the manual-data schema decision) and the
// account row itself, in one transaction. One item per manual account keeps
// deletion simple: dropping the item cascades the account, which in turn
// cascades its transactions.
export async function createManualAccount(input: ManualAccountInput): Promise<Account> {
  return db.transaction(async (tx) => {
    const [item] = await tx.insert(items).values({
      plaidItemId: null,
      accessTokenEnc: null,
      institutionName: null,
      status: "ok",
    }).returning();

    const [account] = await tx.insert(accounts).values({
      itemId: item.id,
      plaidAccountId: null,
      name: input.name,
      type: input.type,
      subtype: input.subtype,
      startingBalance: input.startingBalance.toFixed(2),
      currency: input.currency,
      source: "manual",
    }).returning();

    // Sets current_balance/available_balance from starting_balance (there
    // are no transactions yet) and writes the account's first snapshot, via
    // the same path every later create/edit/delete uses -- no separate
    // "set the initial balance" logic to keep in sync with it.
    await recomputeManualBalance(tx, account.id);
    const [withBalance] = await tx.select().from(accounts).where(eq(accounts.id, account.id));
    return withBalance;
  });
}

// Deletes a manual account and its transactions (cascade via the account's
// dedicated item, see createManualAccount above). Returns null if the
// account does not exist (route handler translates that to 404), and
// throws ValidationError if it exists but is not a manual account (route
// handler translates that to 400) -- Plaid accounts are removed only by
// unlinking their item (src/lib/accounts.ts unlinkItem).
export async function deleteManualAccount(id: number): Promise<Account | null> {
  return db.transaction(async (tx) => {
    const [account] = await tx.select().from(accounts).where(eq(accounts.id, id)).for("update");
    if (!account) return null;
    if (account.source !== "manual") {
      throw new ValidationError("Only manual accounts can be deleted here; unlink the bank connection instead.");
    }
    // Cascades: items -> accounts -> transactions.
    await tx.delete(items).where(eq(items.id, account.itemId));
    return account;
  });
}

// ---------------------------------------------------------------------------
// Manual transaction
// ---------------------------------------------------------------------------

export type ManualTransactionInput = {
  accountId: number;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive magnitude entered by the user
  direction: "in" | "out";
  categoryId: number | null;
  notes: string | null;
};

const TX_ALLOWED_FIELDS = new Set(["accountId", "date", "description", "amount", "direction", "categoryId", "notes"]);

function isPositiveInt(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT;
}

export function validateManualTransactionInput(body: unknown): ManualTransactionInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!TX_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  if (!isPositiveInt(obj.accountId)) throw new ValidationError("accountId must be a positive integer.");

  if (typeof obj.date !== "string" || !isValidCalendarDate(obj.date)) {
    throw new ValidationError("date must be a valid YYYY-MM-DD date.");
  }

  if (typeof obj.description !== "string") throw new ValidationError("description must be a string.");
  const description = obj.description.trim();
  if (description.length < 1 || description.length > MAX_DESCRIPTION_LEN) {
    throw new ValidationError(`description must be between 1 and ${MAX_DESCRIPTION_LEN} characters.`);
  }

  if (typeof obj.amount !== "number" || !Number.isFinite(obj.amount) || obj.amount <= 0) {
    throw new ValidationError("amount must be a positive number.");
  }
  if (obj.amount > MAX_ABS_AMOUNT || !hasAtMostTwoDecimals(obj.amount)) {
    throw new ValidationError("amount must have at most 2 decimal places and be a reasonable amount.");
  }

  if (obj.direction !== "in" && obj.direction !== "out") {
    throw new ValidationError('direction must be "in" or "out".');
  }

  let categoryId: number | null = null;
  if ("categoryId" in obj && obj.categoryId !== null && obj.categoryId !== undefined) {
    if (!isPositiveInt(obj.categoryId)) throw new ValidationError("categoryId must be a positive integer or null.");
    categoryId = obj.categoryId;
  }

  let notes: string | null = null;
  if ("notes" in obj && obj.notes !== null && obj.notes !== undefined) {
    if (typeof obj.notes !== "string") throw new ValidationError("notes must be a string or null.");
    const trimmed = obj.notes.trim();
    if (trimmed.length > MAX_NOTES_LEN) throw new ValidationError(`notes must be at most ${MAX_NOTES_LEN} characters.`);
    notes = trimmed || null;
  }

  return {
    accountId: obj.accountId,
    date: obj.date,
    description,
    amount: obj.amount,
    direction: obj.direction,
    categoryId,
    notes,
  };
}

export type Transaction = typeof transactions.$inferSelect;

// Creates one manual transaction. `input.amount` is the positive magnitude
// the user entered; `direction` flips it to Plaid's sign convention
// (positive = money out) before storing. The target account must exist and
// be a manual account -- both category and account existence are checked
// with the rows locked FOR UPDATE, inside the same transaction as the
// insert, so a concurrent delete can't race between the check and the
// write.
export async function createManualTransaction(input: ManualTransactionInput): Promise<Transaction> {
  return db.transaction(async (tx) => {
    const [account] = await tx.select().from(accounts).where(eq(accounts.id, input.accountId)).for("update");
    if (!account) throw new ValidationError(`Account ${input.accountId} does not exist.`);
    if (account.source !== "manual") {
      throw new ValidationError("Transactions can only be added by hand to manual accounts.");
    }

    if (input.categoryId !== null) {
      const [category] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId)).for("update");
      if (!category) throw new ValidationError(`Category ${input.categoryId} does not exist.`);
    }

    const signedAmount = toPlaidSignedAmount(input.amount, input.direction);
    const [row] = await tx.insert(transactions).values({
      accountId: account.id,
      plaidTransactionId: `manual:${randomUUID()}`,
      date: input.date,
      amount: signedAmount.toFixed(2),
      currency: account.currency ?? "USD",
      name: input.description,
      categoryId: input.categoryId,
      notes: input.notes,
      source: "manual",
    }).returning();
    await recomputeManualBalance(tx, account.id);
    return row;
  });
}

// Deletes a transaction, but only if it is not a Plaid-sourced row. Returns
// null if it does not exist (route handler translates that to 404), and
// throws ValidationError for a Plaid row (route handler translates that to
// 400) -- Plaid transactions can only be edited (display name, category,
// notes), never deleted, since sync would just recreate them anyway.
export async function deleteManualTransaction(id: number): Promise<Transaction | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(transactions).where(eq(transactions.id, id)).for("update");
    if (!row) return null;
    if (row.source === "plaid") {
      throw new ValidationError("Plaid transactions cannot be deleted.");
    }
    await tx.delete(transactions).where(eq(transactions.id, id));
    await recomputeManualBalance(tx, row.accountId);
    return row;
  });
}
