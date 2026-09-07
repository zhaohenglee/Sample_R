import { and, desc, eq, gte, isNull, lt, notInArray, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { accounts, transactions, categories } = schema;

// Categories mapped from these Plaid primaries represent money moving in
// (or between the user's own accounts), not spend. Shared by the dashboard
// spend-by-category list and budgetReport (src/lib/budgets.ts), which both
// need to exclude the same set.
export const INCOME_LIKE_PRIMARIES = ["INCOME", "TRANSFER_IN", "TRANSFER_OUT"];

// Shared base filter for every "current, visible" transactions query the
// dashboard runs: never a removed transaction, and never on a hidden
// account. Callers add their own extra conditions (date range, sign, ...).
export function visibleTransactionsWhere(...extra: SQL[]): SQL {
  return and(eq(transactions.isRemoved, false), eq(accounts.hidden, false), ...extra)!;
}

// The [start, end) date bounds for the calendar month `monthIso` (a
// first-of-month ISO date, e.g. "2026-09-01") names. Pure integer
// arithmetic on the year/month parsed out of the string -- no Date object,
// so there is no local-timezone or UTC-conversion drift near month/year
// boundaries.
export function monthRange(monthIso: string): { start: string; end: string } {
  const [yearStr, monthStr] = monthIso.slice(0, 7).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start: `${yearStr}-${monthStr}-01`, end };
}

// The current calendar month as a first-of-month ISO date, using local
// date parts (not toISOString's UTC conversion, which can land on the
// wrong day near midnight depending on the server's timezone offset).
// Shared by the dashboard and the budgets page so both agree on "this
// month".
export function currentMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export type SpendByCategoryRow = { name: string | null; total: string };

// Net spend (refunds reduce it) grouped by category for the calendar month
// `monthIso`, on visible accounts only. Income-like categories (Plaid
// primary INCOME / TRANSFER_IN / TRANSFER_OUT) and categories whose net for
// the month is zero or negative are left out entirely -- this is the
// dashboard's "what did I spend on" list, not a full ledger.
export async function spendByCategory(monthIso: string): Promise<SpendByCategoryRow[]> {
  const { start, end } = monthRange(monthIso);
  return db
    .select({ name: categories.name, total: sql<string>`sum(${transactions.amount})` })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      visibleTransactionsWhere(
        gte(transactions.date, start),
        lt(transactions.date, end),
        or(isNull(categories.plaidPrimary), notInArray(categories.plaidPrimary, INCOME_LIKE_PRIMARIES))!,
      ),
    )
    .groupBy(categories.name)
    .having(sql`sum(${transactions.amount}) > 0`)
    .orderBy(desc(sql`sum(${transactions.amount})`));
}

export type MonthFlow = { out: string; inflow: string };

// Total money out and in for the calendar month `monthIso`, on visible
// accounts only. Gross, not netted -- this is a cash-flow metric (how much
// moved each direction), unlike spendByCategory's per-category net.
export async function monthFlow(monthIso: string): Promise<MonthFlow> {
  const { start, end } = monthRange(monthIso);
  const [row] = await db
    .select({
      out: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} end), 0)`,
      inflow: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(visibleTransactionsWhere(gte(transactions.date, start), lt(transactions.date, end)));
  return row ?? { out: "0", inflow: "0" };
}

export type RecentTransaction = {
  id: number;
  date: string;
  name: string;
  merchant: string | null;
  amount: string;
  pending: boolean;
};

// Most recent transactions on visible accounts only. Does not select the
// account name -- the dashboard's recent-transactions card never renders it.
export async function recentTransactions(limit: number): Promise<RecentTransaction[]> {
  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      name: transactions.name,
      merchant: transactions.merchantName,
      amount: transactions.amount,
      pending: transactions.isPending,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(visibleTransactionsWhere())
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit);
}
