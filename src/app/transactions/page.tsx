import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { accountLabel } from "@/lib/format";
import { TransactionsTable } from "@/components/TransactionsTable";

export const dynamic = "force-dynamic";
const PAGE = 100;

type Params = { q?: string; account?: string; category?: string; from?: string; to?: string; page?: string };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAuthPage();
  const p = await searchParams;
  const { transactions, accounts, categories, categoryRules } = schema;
  const page = Math.max(1, Number(p.page ?? 1));

  const filters: SQL[] = [eq(transactions.isRemoved, false), eq(accounts.hidden, false)];
  if (p.q) {
    filters.push(
      or(
        ilike(transactions.name, `%${p.q}%`),
        ilike(transactions.merchantName, `%${p.q}%`),
        ilike(transactions.displayName, `%${p.q}%`),
      )!,
    );
  }
  if (p.account) filters.push(eq(transactions.accountId, Number(p.account)));
  if (p.category === "none") filters.push(sql`${transactions.categoryId} is null`);
  else if (p.category) filters.push(eq(transactions.categoryId, Number(p.category)));
  if (p.from) filters.push(gte(transactions.date, p.from));
  if (p.to) filters.push(lte(transactions.date, p.to));

  const rows = await db
    .select({
      id: transactions.id, date: transactions.date, name: transactions.name, merchant: transactions.merchantName,
      displayName: transactions.displayName, notes: transactions.notes,
      amount: transactions.amount, pending: transactions.isPending, categoryId: transactions.categoryId,
      plaidCategory: transactions.plaidCategoryDetailed, account: accounts.name, accountNickname: accounts.nickname, mask: accounts.mask,
      ruleId: transactions.ruleId, ruleName: categoryRules.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categoryRules, eq(transactions.ruleId, categoryRules.id))
    .where(and(...filters))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(PAGE)
    .offset((page - 1) * PAGE);

  const accountRows = await db
    .select({ id: accounts.id, name: accounts.name, nickname: accounts.nickname, mask: accounts.mask })
    .from(accounts)
    .where(eq(accounts.hidden, false))
    .orderBy(accounts.name);
  const categoryRows = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);

  const qs = (over: Partial<Params>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...p, ...over })) if (v) u.set(k, String(v));
    return `?${u.toString()}`;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>

      <form className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={p.q} placeholder="Search" className="rounded border px-2 py-1" />
        <select name="account" defaultValue={p.account ?? ""} className="rounded border px-2 py-1">
          <option value="">All accounts</option>
          {accountRows.map((a) => <option key={a.id} value={a.id}>{accountLabel(a)} {a.mask ? `••${a.mask}` : ""}</option>)}
        </select>
        <select name="category" defaultValue={p.category ?? ""} className="rounded border px-2 py-1">
          <option value="">All categories</option>
          <option value="none">Uncategorized</option>
          {categoryRows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" name="from" defaultValue={p.from} className="rounded border px-2 py-1" />
        <input type="date" name="to" defaultValue={p.to} className="rounded border px-2 py-1" />
        <button className="rounded bg-gray-900 px-3 py-1 text-white">Filter</button>
        <a href="/transactions" className="px-2 py-1 text-gray-500">Reset</a>
      </form>

      <TransactionsTable rows={rows} categories={categoryRows} />

      <div className="flex justify-between text-sm">
        {page > 1 ? <a href={qs({ page: String(page - 1) })} className="underline">Previous</a> : <span />}
        {rows.length === PAGE && <a href={qs({ page: String(page + 1) })} className="underline">Next</a>}
      </div>
    </div>
  );
}
