import { eq } from "drizzle-orm";
import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { accountLabel, money, signedAmount } from "@/lib/format";
import { monthFlow, recentTransactions, spendByCategory as spendByCategoryReport } from "@/lib/reports";
import { LinkButton } from "@/components/LinkButton";
import { SyncButton } from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireAuthPage();
  const { items, accounts } = schema;

  const itemRows = await db.select().from(items).orderBy(items.id);
  const accountRows = await db.select().from(accounts).where(eq(accounts.hidden, false)).orderBy(accounts.itemId, accounts.name);

  const monthStart = new Date(); monthStart.setDate(1);
  const monthIso = monthStart.toISOString().slice(0, 10);

  const spendByCategory = await spendByCategoryReport(monthIso);
  const flow = await monthFlow(monthIso);
  const recent = await recentTransactions(10);

  const netWorth = accountRows
    .filter((a) => !a.excludeFromTotals)
    .reduce((s, a) => {
      const bal = parseFloat(a.currentBalance ?? "0");
      return s + (a.type === "credit" || a.type === "loan" ? -bal : bal);
    }, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <div className="flex gap-2">
          <SyncButton />
          <LinkButton />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Net balance" value={money(netWorth)} />
        <Stat label="Spent this month" value={money(flow.out)} />
        <Stat label="Income this month" value={money(flow.inflow)} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Accounts</h2>
        {itemRows.length === 0 && <p className="text-sm text-gray-500">No banks linked yet. Click “Link a bank”.</p>}
        <div className="space-y-4">
          {itemRows.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white">
              <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
                <div>
                  <span className="font-medium">{item.institutionName ?? "Institution"}</span>
                  <span className="ml-2 text-gray-500">
                    {item.lastSyncedAt ? `synced ${item.lastSyncedAt.toLocaleString()}` : "not synced yet"}
                  </span>
                </div>
                {item.status !== "ok" && (
                  <div className="flex items-center gap-2 text-red-600">
                    <span>{item.status === "login_required" ? "Needs re-login" : item.lastError ?? "Error"}</span>
                    <LinkButton itemId={item.id} label="Fix" />
                  </div>
                )}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {accountRows.filter((a) => a.itemId === item.id).map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{accountLabel(a)} {a.mask && <span className="text-gray-400">••{a.mask}</span>}</td>
                      <td className="px-4 py-2 text-gray-500">{a.subtype ?? a.type}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{money(a.currentBalance, a.currency ?? "USD")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-medium">Spend by category (this month)</h2>
          <table className="w-full rounded-lg border bg-white text-sm">
            <tbody>
              {spendByCategory.length === 0 && <tr><td className="px-4 py-2 text-gray-500">No spending yet.</td></tr>}
              {spendByCategory.map((r) => (
                <tr key={r.name ?? "none"} className="border-b last:border-0">
                  <td className="px-4 py-2">{r.name ?? "Uncategorized"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="mb-2 font-medium">Recent transactions</h2>
          <table className="w-full rounded-lg border bg-white text-sm">
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-3 py-2 text-gray-500">{t.date}</td>
                  <td className="px-3 py-2">{t.merchant ?? t.name}{t.pending && <span className="ml-1 text-xs text-amber-600">pending</span>}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${signedAmount(t.amount) > 0 ? "text-green-700" : ""}`}>
                    {money(signedAmount(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
