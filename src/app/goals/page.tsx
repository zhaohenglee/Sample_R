import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { goalsWithProgress } from "@/lib/goals";
import { accountLabel, money } from "@/lib/format";
import { GoalEditor } from "@/components/GoalEditor";
import { GoalProgressBar } from "@/components/GoalProgressBar";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  await requireAuthPage();

  const accountRows = await db.select().from(schema.accounts).orderBy(schema.accounts.name);

  const goalRows = await goalsWithProgress();
  const accountOptions = accountRows
    .filter((a) => !a.hidden)
    .map((a) => ({ id: a.id, label: accountLabel(a) }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Goals</h1>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">New goal</h2>
        <GoalEditor accountOptions={accountOptions} />
      </div>

      <div className="space-y-4">
        {goalRows.length === 0 && (
          <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">No goals yet.</p>
        )}
        {goalRows.map((g) => (
          <div key={g.id} className="rounded-lg border bg-white p-4">
            <div className="mb-3 border-b pb-3">
              <GoalEditor
                goal={{
                  id: g.id,
                  name: g.name,
                  accountId: g.accountId,
                  targetAmount: g.targetAmount,
                  currentAmount: g.currentAmount,
                  targetDate: g.targetDate,
                }}
                accountOptions={accountOptions}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {money(g.progress.currentAmount)} of {money(parseFloat(g.targetAmount))}
                  {g.accountName && <span className="ml-1 text-gray-400">({g.accountName})</span>}
                </span>
                <span className="font-medium tabular-nums">{g.progress.percent.toFixed(0)}%</span>
              </div>
              <GoalProgressBar percent={g.progress.percent} />
              {g.targetDate && (
                <p className="text-xs text-gray-500">
                  Target date {g.targetDate}
                  {g.requiredMonthly !== null && g.requiredMonthly > 0 && (
                    <> &middot; needs {money(g.requiredMonthly)}/month to hit it</>
                  )}
                  {g.requiredMonthly === 0 && <> &middot; goal met</>}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
