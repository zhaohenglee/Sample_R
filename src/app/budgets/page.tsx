import Link from "next/link";
import { requireAuthPage } from "@/lib/auth";
import { budgetReport, validateMonth } from "@/lib/budgets";
import { ValidationError } from "@/lib/categories";
import { currentMonthIso } from "@/lib/reports";
import { BudgetTable } from "@/components/BudgetTable";

export const dynamic = "force-dynamic";

type Params = { month?: string | string[] };

// Next hands repeated query keys through as an array rather than a string.
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Shares currentMonthIso() (local date parts) with the dashboard so both
// pages agree on "this month", then trims to the "YYYY-MM" shape this page
// works with.
function currentMonthStr(): string {
  return currentMonthIso().slice(0, 7);
}

// Plain integer arithmetic on year/month -- no Date object, so there is no
// local-timezone or UTC-conversion drift near month/year boundaries.
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

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAuthPage();
  const rawSp = await searchParams;
  const rawMonth = first(rawSp.month);

  // Default to the current month; an invalid ?month= falls back to the
  // current month too, rather than 400ing the page.
  let monthStr = rawMonth ?? currentMonthStr();
  let monthIso: string;
  try {
    monthIso = validateMonth(monthStr);
  } catch (e) {
    if (!(e instanceof ValidationError)) throw e;
    monthStr = currentMonthStr();
    monthIso = validateMonth(monthStr);
  }

  const report = await budgetReport(monthIso);
  const prevMonth = shiftMonth(monthStr, -1);
  const nextMonth = shiftMonth(monthStr, 1);

  const expenseRows = report.rows.filter((r) => !r.isIncomeLike);
  const incomeRows = report.rows.filter((r) => r.isIncomeLike);
  const hasBudgetsThisMonth = report.rows.some((r) => r.budget !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budgets</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/budgets?month=${prevMonth}`} className="text-gray-600 hover:text-gray-900">
            ← Prev
          </Link>
          <span className="font-medium">{monthStr}</span>
          <Link href={`/budgets?month=${nextMonth}`} className="text-gray-600 hover:text-gray-900">
            Next →
          </Link>
        </div>
      </div>

      <BudgetTable
        month={monthStr}
        prevMonth={prevMonth}
        expenseRows={expenseRows}
        incomeRows={incomeRows}
        totals={report.totals}
        hasBudgetsThisMonth={hasBudgetsThisMonth}
      />
    </div>
  );
}
