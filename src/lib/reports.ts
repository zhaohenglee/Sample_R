import { and, desc, eq, gte, isNull, lt, notInArray, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { accounts, transactions, categories, balanceSnapshots } = schema;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Categories mapped from these Plaid primaries represent money moving in
// (or between the user's own accounts), not spend. Shared by the dashboard
// spend-by-category list and budgetReport (src/lib/budgets.ts), which both
// need to exclude the same set.
export const INCOME_LIKE_PRIMARIES = ["INCOME", "TRANSFER_IN", "TRANSFER_OUT"];

// Plaid primaries that mark a transfer between the user's own accounts.
// Excluded entirely from cash flow (neither in nor out) -- unlike
// INCOME_LIKE_PRIMARIES above, INCOME itself stays in moneyIn for these
// cash-flow metrics since it is real money entering the household, just not
// counted as "spend" on the category list.
const OWN_TRANSFER_PRIMARIES = ["TRANSFER_IN", "TRANSFER_OUT"];

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

// Today's date as an ISO date (YYYY-MM-DD), using local date parts (not
// toISOString's UTC conversion, which can land on the wrong day near
// midnight depending on the server's timezone offset). Used to stamp
// balance_snapshots rows written during a sync pass.
export function currentDateIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// `monthIso` (a first-of-month ISO date) shifted by `delta` calendar
// months. Plain integer arithmetic on year/month -- no Date object, so
// there is no local-timezone or UTC-conversion drift near month/year
// boundaries. Mirrors the shiftMonth helper on the budgets page, which
// works on "YYYY-MM" strings instead.
function shiftMonthIso(monthIso: string, delta: number): string {
  const [yearStr, monthStr] = monthIso.slice(0, 7).split("-");
  let year = Number(yearStr);
  let month = Number(monthStr) + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export type SpendByCategoryRow = { categoryId: number | null; name: string | null; total: string };

// Net spend (refunds reduce it) grouped by category for the calendar month
// `monthIso`, on visible accounts only. Income-like categories (Plaid
// primary INCOME / TRANSFER_IN / TRANSFER_OUT) and categories whose net for
// the month is zero or negative are left out entirely -- this is the
// dashboard's "what did I spend on" list, not a full ledger. Grouped by
// categories.id (categories.name is functionally dependent on it, its
// primary key) rather than by name, so the caller can key rows on a stable
// id instead of a display string.
export async function spendByCategory(monthIso: string): Promise<SpendByCategoryRow[]> {
  const { start, end } = monthRange(monthIso);
  return db
    .select({ categoryId: categories.id, name: categories.name, total: sql<string>`sum(${transactions.amount})` })
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
    .groupBy(categories.id)
    .having(sql`sum(${transactions.amount}) > 0`)
    .orderBy(desc(sql`sum(${transactions.amount})`));
}

export type MonthFlow = { out: string; inflow: string };

// Total money out and in for the calendar month `monthIso`, on visible
// accounts only. Gross, not netted -- this is a cash-flow metric (how much
// moved each direction), unlike spendByCategory's per-category net.
// Excludes the user's own transfers between accounts (TRANSFER_IN /
// TRANSFER_OUT), matching cashFlowByMonth, so the dashboard stat cards
// agree with the cash flow chart.
export async function monthFlow(monthIso: string): Promise<MonthFlow> {
  const { start, end } = monthRange(monthIso);
  const [row] = await db
    .select({
      out: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} end), 0)`,
      inflow: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      visibleTransactionsWhere(
        gte(transactions.date, start),
        lt(transactions.date, end),
        or(isNull(categories.plaidPrimary), notInArray(categories.plaidPrimary, OWN_TRANSFER_PRIMARIES))!,
      ),
    );
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

export type CashFlowMonth = { month: string; moneyIn: number; moneyOut: number };

// Money in vs money out for each of the `months` calendar months ending at
// (and including) `endMonthIso`, on visible accounts only. Gross like
// monthFlow (not netted per category), excluding the user's own transfers
// between accounts. Months with no matching transactions are included as
// zero rather than omitted, so callers always get exactly `months` points
// in chronological order.
export async function cashFlowByMonth(endMonthIso: string, months = 12): Promise<CashFlowMonth[]> {
  const startMonthIso = shiftMonthIso(endMonthIso, -(months - 1));
  const { start } = monthRange(startMonthIso);
  const { end } = monthRange(endMonthIso);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${transactions.date}), 'YYYY-MM-DD')`,
      moneyOut: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} end), 0)`,
      moneyIn: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      visibleTransactionsWhere(
        gte(transactions.date, start),
        lt(transactions.date, end),
        or(isNull(categories.plaidPrimary), notInArray(categories.plaidPrimary, OWN_TRANSFER_PRIMARIES))!,
      ),
    )
    .groupBy(sql`date_trunc('month', ${transactions.date})`);

  const byMonthKey = new Map(rows.map((r) => [r.month.slice(0, 7), r]));
  const result: CashFlowMonth[] = [];
  for (let i = 0; i < months; i++) {
    const monthIso = shiftMonthIso(startMonthIso, i);
    const row = byMonthKey.get(monthIso.slice(0, 7));
    result.push({
      month: monthIso,
      moneyIn: row ? round2(parseFloat(row.moneyIn)) : 0,
      moneyOut: row ? round2(parseFloat(row.moneyOut)) : 0,
    });
  }
  return result;
}

export type NetBalancePoint = { date: string; net: number };

const NET_SUBTRACT_TYPES = new Set(["credit", "loan"]);

// Net balance over time from balance_snapshots, on accounts that are
// neither hidden nor excluded from totals (same accounts as the dashboard's
// net worth figure). Credit and loan balances are subtracted, matching the
// dashboard's net worth arithmetic. One point per date that has at least
// one snapshot in the last `days` days; an account with no snapshot for a
// given date has its last known balance carried forward (an account with no
// snapshot at all yet contributes nothing until its first one appears).
export async function netBalanceTrend(days = 90): Promise<NetBalancePoint[]> {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const cutoffIso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;

  const eligible = and(eq(accounts.hidden, false), eq(accounts.excludeFromTotals, false))!;

  const [rows, priorRows] = await Promise.all([
    db
      .select({
        accountId: balanceSnapshots.accountId,
        date: balanceSnapshots.date,
        current: balanceSnapshots.current,
        type: accounts.type,
      })
      .from(balanceSnapshots)
      .innerJoin(accounts, eq(balanceSnapshots.accountId, accounts.id))
      .where(and(eligible, gte(balanceSnapshots.date, cutoffIso)))
      .orderBy(balanceSnapshots.date, balanceSnapshots.accountId),
    // The most recent snapshot before the window, per eligible account --
    // seeds the carry-forward map so an account that hasn't synced within
    // the window (but has synced before it) still contributes its last
    // known balance to every point in the window, rather than dropping out
    // until its next in-window snapshot.
    db
      .selectDistinctOn([balanceSnapshots.accountId], {
        accountId: balanceSnapshots.accountId,
        current: balanceSnapshots.current,
        type: accounts.type,
      })
      .from(balanceSnapshots)
      .innerJoin(accounts, eq(balanceSnapshots.accountId, accounts.id))
      .where(and(eligible, lt(balanceSnapshots.date, cutoffIso)))
      .orderBy(balanceSnapshots.accountId, desc(balanceSnapshots.date)),
  ]);

  const byDate = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byDate.get(r.date);
    if (list) list.push(r);
    else byDate.set(r.date, [r]);
  }
  const dates = [...byDate.keys()].sort();

  const lastBalance = new Map<number, number>();
  const accountType = new Map<number, string>();
  for (const r of priorRows) {
    accountType.set(r.accountId, r.type);
    if (r.current !== null) lastBalance.set(r.accountId, parseFloat(r.current));
  }

  const result: NetBalancePoint[] = [];
  for (const date of dates) {
    for (const r of byDate.get(date)!) {
      accountType.set(r.accountId, r.type);
      if (r.current !== null) lastBalance.set(r.accountId, parseFloat(r.current));
    }
    let net = 0;
    for (const [accountId, balance] of lastBalance) {
      const type = accountType.get(accountId);
      net += type && NET_SUBTRACT_TYPES.has(type) ? -balance : balance;
    }
    result.push({ date, net: round2(net) });
  }
  return result;
}
