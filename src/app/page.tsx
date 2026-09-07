import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { ValidationError } from "@/lib/categories";
import { validateMonth } from "@/lib/budgets";
import { accountLabel, money, signedAmount } from "@/lib/format";
import {
  cashFlowByMonth,
  currentMonthIso,
  monthFlow,
  netBalanceTrend,
  recentTransactions,
  spendByCategory as spendByCategoryReport,
} from "@/lib/reports";
import { upcomingRecurring } from "@/lib/recurring";
import { LinkButton } from "@/components/LinkButton";
import { SyncButton } from "@/components/SyncButton";
import { RecurringRefreshButton } from "@/components/RecurringRefreshButton";
import { CashFlowBars } from "@/components/charts/CashFlowBars";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { BalanceLine } from "@/components/charts/BalanceLine";

export const dynamic = "force-dynamic";

// Matches validateMonth's bounded year range (src/lib/budgets.ts): the
// month nav must not offer a Prev/Next that validateMonth would reject.
const MIN_MONTH_STR = "2000-01";
const MAX_MONTH_STR = "2099-12";

type Params = { month?: string | string[] };

// Next hands repeated query keys through as an array rather than a string.
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function currentMonthStr(): string {
  return currentMonthIso().slice(0, 7);
}

// Plain integer arithmetic on year/month -- no Date object, so there is no
// local-timezone or UTC-conversion drift near month/year boundaries. Same
// shape as the budgets page's shiftMonth.
function shiftMonth(monthStr: string, delta: number): string {
  const [yearStr, monthStr2] = monthStr.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr2) + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAuthPage();
  const { items, accounts } = schema;

  const rawSp = await searchParams;
  const rawMonth = first(rawSp.month);

  // Default to the current month; an invalid ?month= falls back to the
  // current month too, rather than 400ing the page (same rule as /budgets).
  let monthStr = rawMonth ?? currentMonthStr();
  let monthIso: string;
  try {
    monthIso = validateMonth(monthStr);
  } catch (e) {
    if (!(e instanceof ValidationError)) throw e;
    monthStr = currentMonthStr();
    monthIso = validateMonth(monthStr);
  }
  const prevMonth = shiftMonth(monthStr, -1);
  const nextMonth = shiftMonth(monthStr, 1);
  const canGoPrev = prevMonth >= MIN_MONTH_STR;
  const canGoNext = nextMonth <= MAX_MONTH_STR;
  const isCurrentMonth = monthStr === currentMonthStr();

  const itemRows = await db.select().from(items).orderBy(items.id);
  const accountRows = await db.select().from(accounts).where(eq(accounts.hidden, false)).orderBy(accounts.itemId, accounts.name);

  const spendByCategory = await spendByCategoryReport(monthIso);
  const flow = await monthFlow(monthIso);
  const recent = await recentTransactions(10);
  const upcoming = await upcomingRecurring(30);
  const cashFlow = await cashFlowByMonth(monthIso, 12);
  const balanceTrend = await netBalanceTrend(90);

  const netWorth = accountRows
    .filter((a) => !a.excludeFromTotals)
    .reduce((s, a) => {
      const bal = parseFloat(a.currentBalance ?? "0");
      return s + (a.type === "credit" || a.type === "loan" ? -bal : bal);
    }, 0);

  const categoryChartData = spendByCategory.map((r) => ({
    categoryId: r.categoryId,
    name: r.name ?? "Uncategorized",
    amount: parseFloat(r.total),
  }));
  const periodLabel = isCurrentMonth ? "this month" : `in ${monthStr}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
        <div className="flex gap-2">
          <SyncButton />
          <LinkButton />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {canGoPrev && (
            <Link href={`/?month=${prevMonth}`} className="text-gray-600 hover:text-gray-900">
              ← Prev
            </Link>
          )}
          <span className="font-medium">{monthStr}</span>
          {canGoNext && (
            <Link href={`/?month=${nextMonth}`} className="text-gray-600 hover:text-gray-900">
              Next →
            </Link>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Net balance" value={money(netWorth)} />
        <Stat
          label={isCurrentMonth ? "Spent this month" : `Spent in ${monthStr}`}
          value={money(flow.out)}
          note="Gross outflow, excluding transfers between your own accounts. The category list nets refunds."
        />
        <Stat label={isCurrentMonth ? "Income this month" : `Income in ${monthStr}`} value={money(flow.inflow)} />
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-medium">Cash flow (12 months to {monthStr})</h2>
          <CashFlowBars data={cashFlow} />
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-medium">Net balance trend (last 90 days)</h2>
          <BalanceLine data={balanceTrend} />
          {balanceTrend.length < 2 && (
            <p className="mt-2 text-xs text-gray-500">Balance history builds up as syncs run.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Spend by category ({monthStr})</h2>
        <div className="rounded-lg border bg-white p-4">
          <CategoryBars data={categoryChartData} periodLabel={periodLabel} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-medium">Upcoming (overdue and next 30 days)</h2>
          <div className="rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs text-gray-500">Recurring charges detected from transaction history.</span>
              <RecurringRefreshButton />
            </div>
            {upcoming.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">No recurring charges detected yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {upcoming.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <div>
                          {r.displayName}
                          {r.overdue && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">overdue</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{r.accountLabel}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{r.cadence}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">{r.nextDue}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(r.expectedAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {note && <div className="mt-1 text-xs text-gray-400">{note}</div>}
    </div>
  );
}
