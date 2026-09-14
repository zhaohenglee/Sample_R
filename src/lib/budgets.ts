import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "./categories";
import { INCOME_LIKE_PRIMARIES, monthRange, visibleTransactionsWhere } from "./reports";

const { budgets, categories, transactions, accounts } = schema;

const MONTH_RE = /^\d{4}-\d{2}$/;
const MIN_YEAR = 2000;
const MAX_YEAR = 2099;
const MAX_PG_INT = 2147483647; // postgres integer column max
const MAX_ITEMS = 500;
// Amount column is numeric(14,2); keep well clear of that range so a value
// that passes our own check never trips a Postgres 22003 out of range
// error either.
const MAX_ABS_AMOUNT = 1e12;

const INCOME_LIKE_SET = new Set(INCOME_LIKE_PRIMARIES);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Validates a "YYYY-MM" string and returns the first-of-month ISO date the
// `budgets.month` column stores. Year is bounded to 2000..2099 -- well past
// what this app will ever see, but tight enough to catch a garbage year
// (e.g. "0000" or "9999") as a 400 instead of storing it. Throws
// ValidationError otherwise.
export function validateMonth(raw: unknown): string {
  if (typeof raw !== "string" || !MONTH_RE.test(raw)) {
    throw new ValidationError("month must be in YYYY-MM format.");
  }
  const [yearStr, monthStr] = raw.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new ValidationError(`month year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
  }
  if (month < 1 || month > 12) {
    throw new ValidationError("month must be in YYYY-MM format.");
  }
  return `${yearStr}-${monthStr}-01`;
}

export type BudgetItemInput = { categoryId: number; amount: number | null };

const LIST_ALLOWED_FIELDS = new Set(["month", "items"]);
const ITEM_ALLOWED_FIELDS = new Set(["categoryId", "amount"]);

function isPositiveInt(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT;
}

// An amount is stored numeric(14,2); reject anything with more than 2
// decimal places rather than silently rounding it. Compares in cents with a
// small epsilon to tolerate ordinary binary-float representation error
// (e.g. 19.99 * 100 === 1998.9999999999998).
function hasAtMostTwoDecimals(amount: number): boolean {
  return Math.abs(Math.round(amount * 100) - amount * 100) < 1e-6;
}

// Validates and normalizes a raw JSON PUT body for /api/budgets. Unknown
// top-level and item fields are rejected outright, as is a duplicate
// categoryId across items.
export function validateBudgetList(body: unknown): { monthIso: string; items: BudgetItemInput[] } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!LIST_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  if (!("month" in obj)) throw new ValidationError("month is required.");
  const monthIso = validateMonth(obj.month);

  if (!("items" in obj)) throw new ValidationError("items is required.");
  const rawItems = obj.items;
  if (!Array.isArray(rawItems)) throw new ValidationError("items must be an array.");
  if (rawItems.length > MAX_ITEMS) throw new ValidationError(`items must have at most ${MAX_ITEMS} entries.`);

  const seen = new Set<number>();
  const items: BudgetItemInput[] = [];
  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new ValidationError("each item must be an object.");
    }
    const itemObj = raw as Record<string, unknown>;
    for (const key of Object.keys(itemObj)) {
      if (!ITEM_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
    }

    if (!("categoryId" in itemObj) || !isPositiveInt(itemObj.categoryId)) {
      throw new ValidationError("categoryId must be a positive integer.");
    }
    const categoryId = itemObj.categoryId;
    if (seen.has(categoryId)) throw new ValidationError(`Duplicate categoryId ${categoryId}.`);
    seen.add(categoryId);

    if (!("amount" in itemObj)) throw new ValidationError("amount is required.");
    const rawAmount = itemObj.amount;
    let amount: number | null;
    if (rawAmount === null) {
      amount = null;
    } else if (
      typeof rawAmount === "number" &&
      Number.isFinite(rawAmount) &&
      rawAmount >= 0 &&
      rawAmount < MAX_ABS_AMOUNT &&
      hasAtMostTwoDecimals(rawAmount)
    ) {
      amount = rawAmount;
    } else {
      throw new ValidationError("amount must be a number >= 0 and < 1e12 with at most 2 decimals, or null.");
    }

    items.push({ categoryId, amount });
  }

  return { monthIso, items };
}

// Upserts (or deletes, for a null amount) a batch of budget rows for one
// month, all in one transaction. Every referenced category is locked FOR
// UPDATE and checked to exist before any write happens, so a request naming
// a non-existent category fails atomically with no partial writes.
export async function upsertBudgets(monthIso: string, items: BudgetItemInput[]): Promise<void> {
  if (items.length === 0) return;
  await db.transaction(async (tx) => {
    const ids = items.map((i) => i.categoryId);
    const existing = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(inArray(categories.id, ids))
      .for("update");
    const existingIds = new Set(existing.map((r) => r.id));
    const missing = ids.find((id) => !existingIds.has(id));
    if (missing !== undefined) throw new ValidationError(`Category ${missing} does not exist.`);

    for (const item of items) {
      if (item.amount === null) {
        await tx.delete(budgets).where(and(eq(budgets.categoryId, item.categoryId), eq(budgets.month, monthIso)));
      } else {
        const amountStr = item.amount.toFixed(2);
        await tx
          .insert(budgets)
          .values({ categoryId: item.categoryId, month: monthIso, amount: amountStr })
          .onConflictDoUpdate({
            target: [budgets.categoryId, budgets.month],
            set: { amount: amountStr },
          });
      }
    }
  });
}

// Copies every budget row from `fromMonthIso` into `toMonthIso`. Without
// `overwrite`, categories that already have a budget in `toMonthIso` are
// left untouched; with it, they're replaced. Returns the number of rows
// written.
export async function copyBudgets(
  fromMonthIso: string,
  toMonthIso: string,
  opts: { overwrite: boolean },
): Promise<number> {
  if (fromMonthIso === toMonthIso) {
    throw new ValidationError("from and to must be different months.");
  }
  return db.transaction(async (tx) => {
    const fromRows = await tx
      .select({ categoryId: budgets.categoryId, amount: budgets.amount })
      .from(budgets)
      .where(eq(budgets.month, fromMonthIso));
    if (fromRows.length === 0) return 0;

    let existingIds = new Set<number>();
    if (!opts.overwrite) {
      const existing = await tx
        .select({ categoryId: budgets.categoryId })
        .from(budgets)
        .where(eq(budgets.month, toMonthIso));
      existingIds = new Set(existing.map((r) => r.categoryId));
    }

    const toWrite = fromRows.filter((r) => opts.overwrite || !existingIds.has(r.categoryId));
    for (const row of toWrite) {
      await tx
        .insert(budgets)
        .values({ categoryId: row.categoryId, month: toMonthIso, amount: row.amount })
        .onConflictDoUpdate({
          target: [budgets.categoryId, budgets.month],
          set: { amount: row.amount },
        });
    }
    return toWrite.length;
  });
}

export type BudgetReportRow = {
  categoryId: number | null; // null is the synthetic "Uncategorized" row
  name: string;
  parentId: number | null;
  plaidPrimary: string | null;
  budget: number | null;
  actual: number;
  remaining: number | null;
  isIncomeLike: boolean;
};

export type BudgetReport = {
  month: string;
  rows: BudgetReportRow[];
  totals: { budget: number; actual: number; remaining: number };
};

// Every category for `monthIso`, joined with its budget (if any) for that
// month and its net actual spend (visible accounts, non-removed
// transactions, refunds netted in -- same rules as spendByCategory).
// Income-like categories (Plaid primary INCOME / TRANSFER_IN /
// TRANSFER_OUT) are flagged but excluded from the totals row. Transactions
// with no category at all are rolled into a synthetic "Uncategorized" row
// (categoryId: null) when their net is non-zero, counted in totals.actual
// but never budgetable.
export async function budgetReport(monthIso: string): Promise<BudgetReport> {
  const { start, end } = monthRange(monthIso);

  const [categoryRows, budgetRows, spendRows] = await Promise.all([
    db.select().from(categories).orderBy(categories.name),
    db.select({ categoryId: budgets.categoryId, amount: budgets.amount }).from(budgets).where(eq(budgets.month, monthIso)),
    db
      .select({ categoryId: transactions.categoryId, total: sql<string>`sum(${transactions.amount})` })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(visibleTransactionsWhere(gte(transactions.date, start), lt(transactions.date, end)))
      .groupBy(transactions.categoryId),
  ]);

  const budgetByCat = new Map(budgetRows.map((r) => [r.categoryId, parseFloat(r.amount)]));
  const spendByCat = new Map<number, number>();
  let uncategorizedActual = 0;
  for (const r of spendRows) {
    if (r.categoryId === null) {
      uncategorizedActual += parseFloat(r.total);
    } else {
      spendByCat.set(r.categoryId, parseFloat(r.total));
    }
  }

  let totalBudget = 0;
  let totalActual = 0;

  const rows: BudgetReportRow[] = categoryRows.map((c) => {
    const budget = budgetByCat.get(c.id) ?? null;
    const actual = spendByCat.get(c.id) ?? 0;
    const remaining = budget !== null ? round2(budget - actual) : null;
    const isIncomeLike = c.plaidPrimary !== null && INCOME_LIKE_SET.has(c.plaidPrimary);

    if (!isIncomeLike) {
      totalBudget += budget ?? 0;
      totalActual += actual;
    }

    return {
      categoryId: c.id,
      name: c.name,
      parentId: c.parentId,
      plaidPrimary: c.plaidPrimary,
      budget,
      actual,
      remaining,
      isIncomeLike,
    };
  });

  if (uncategorizedActual !== 0) {
    totalActual += uncategorizedActual;
    rows.push({
      categoryId: null,
      name: "Uncategorized",
      parentId: null,
      plaidPrimary: null,
      budget: null,
      actual: round2(uncategorizedActual),
      remaining: null,
      isIncomeLike: false,
    });
  }

  return {
    month: monthIso,
    rows,
    totals: { budget: round2(totalBudget), actual: round2(totalActual), remaining: round2(totalBudget - totalActual) },
  };
}
