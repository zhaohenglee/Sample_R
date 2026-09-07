import { and, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { accounts, transactions, categories } = schema;

// Shared base filter for every "current, visible" transactions query the
// dashboard runs: never a removed transaction, and never on a hidden
// account. Callers add their own extra conditions (date range, sign, ...).
function visibleTransactionsWhere(...extra: SQL[]): SQL {
  return and(eq(transactions.isRemoved, false), eq(accounts.hidden, false), ...extra)!;
}

export type SpendByCategoryRow = { name: string | null; total: string };

// Outflow (amount > 0) grouped by category for transactions dated on or
// after `monthIso`, on visible accounts only.
export async function spendByCategory(monthIso: string): Promise<SpendByCategoryRow[]> {
  return db
    .select({ name: categories.name, total: sql<string>`sum(${transactions.amount})` })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(visibleTransactionsWhere(gte(transactions.date, monthIso), sql`${transactions.amount} > 0`))
    .groupBy(categories.name)
    .orderBy(desc(sql`sum(${transactions.amount})`));
}

export type MonthFlow = { out: string; inflow: string };

// Total money out and in since `monthIso`, on visible accounts only.
export async function monthFlow(monthIso: string): Promise<MonthFlow> {
  const [row] = await db
    .select({
      out: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} end), 0)`,
      inflow: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} end), 0)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(visibleTransactionsWhere(gte(transactions.date, monthIso)));
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
