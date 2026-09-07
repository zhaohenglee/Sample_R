import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { money, signedAmount } from "@/lib/format";
import { CategorySelect } from "@/components/CategorySelect";

export const dynamic = "force-dynamic";
const PAGE = 100;

type Params = { q?: string; account?: string; category?: string; from?: string; to?: string; page?: string };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAuthPage();
  const p = await searchParams;
  const { transactions, accounts, categories } = schema;
  const page = Math.max(1, Number(p.page ?? 1));

  const filters: SQL[] = [eq(transactions.isRemoved, false)];
  if (p.q) filters.push(or(ilike(transactions.name, `%${p.q}%`), ilike(transactions.merchantName, `%${p.q}%`))!);
  if (p.account) filters.push(eq(transactions.accountId, Number(p.account)));
  if (p.category === "none") filters.push(sql`${transactions.categoryId} is null`);
  else if (p.category) filters.push(eq(transactions.categoryId, Number(p.category)));
  if (p.from) filters.push(gte(transactions.date, p.from));
  if (p.to) filters.push(lte(transactions.date, p.to));

  const rows = await db
    .select({
      id: transactions.id, date: transactions.date, name: transactions.name, merchant: transactions.merchantName,
      amount: transactions.amount, pending: transactions.isPending, categoryId: transactions.categoryId,
      plaidCategory: transactions.plaidCategoryDetailed, account: accounts.name, mask: accounts.mask,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(...filters))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(PAGE)
    .offset((page - 1) * PAGE);

  const accountRows = await db.select({ id: accounts.id, name: accounts.name, mask: accounts.mask }).from(accounts).orderBy(accounts.name);
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
          {accountRows.map((a) => <option key={a.id} value={a.id}>{a.name} {a.mask ? `••${a.mask}` : ""}</option>)}
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

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-gray-500">No transactions.</td></tr>}
            {rows.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="whitespace-nowrap px-3 py-2 text-gray-500">{t.date}</td>
                <td className="px-3 py-2">
                  <div>{t.merchant ?? t.name}{t.pending && <span className="ml-1 text-xs text-amber-600">pending</span>}</div>
                  {t.merchant && t.merchant !== t.name && <div className="text-xs text-gray-400">{t.name}</div>}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500">{t.account}{t.mask ? ` ••${t.mask}` : ""}</td>
                <td className="px-3 py-2">
                  <CategorySelect txId={t.id} value={t.categoryId} categories={categoryRows} />
                  {t.plaidCategory && <div className="mt-0.5 text-[10px] text-gray-400">{t.plaidCategory}</div>}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${signedAmount(t.amount) > 0 ? "text-green-700" : ""}`}>
                  {money(signedAmount(t.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-sm">
        {page > 1 ? <a href={qs({ page: String(page - 1) })} className="underline">Previous</a> : <span />}
        {rows.length === PAGE && <a href={qs({ page: String(page + 1) })} className="underline">Next</a>}
      </div>
    </div>
  );
}
