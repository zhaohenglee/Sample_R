"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, signedAmount } from "@/lib/format";

export type BudgetRow = {
  categoryId: number | null; // null is the synthetic "Uncategorized" row
  name: string;
  budget: number | null;
  actual: number;
  remaining: number | null;
};

// Editable budget grid for one month. Holds edited amounts locally and
// PUTs only the rows the user actually touched; "Copy from previous month"
// POSTs the copy endpoint, confirming (and setting overwrite) when this
// month already has budgets.
export function BudgetTable({
  month,
  prevMonth,
  expenseRows,
  incomeRows,
  totals,
  hasBudgetsThisMonth,
}: {
  month: string;
  prevMonth: string;
  expenseRows: BudgetRow[];
  incomeRows: BudgetRow[];
  totals: { budget: number; actual: number; remaining: number };
  hasBudgetsThisMonth: boolean;
}) {
  const router = useRouter();
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function valueFor(categoryId: number, budget: number | null): string {
    if (categoryId in edited) return edited[categoryId];
    return budget !== null ? String(budget) : "";
  }

  function onChange(categoryId: number, value: string) {
    setEdited((prev) => ({ ...prev, [categoryId]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const items: { categoryId: number; amount: number | null }[] = [];
      for (const [idStr, raw] of Object.entries(edited)) {
        const categoryId = Number(idStr);
        const trimmed = raw.trim();
        if (trimmed === "") {
          items.push({ categoryId, amount: null });
          continue;
        }
        const n = Number(trimmed);
        if (!Number.isFinite(n) || n < 0) {
          setError(`Invalid amount for category ${categoryId}.`);
          return;
        }
        items.push({ categoryId, amount: Math.round(n * 100) / 100 });
      }
      if (items.length === 0) return;

      const res = await fetch("/api/budgets", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ month, items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setEdited({});
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function copyFromPrevious() {
    let overwrite = false;
    if (hasBudgetsThisMonth) {
      const ok = window.confirm(`${month} already has budgets. Overwrite them with ${prevMonth}'s budgets?`);
      if (!ok) return;
      overwrite = true;
    }
    setCopying(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets/copy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: prevMonth, to: month, overwrite }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={copyFromPrevious}
          disabled={copying}
          className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {copying ? "Copying…" : "Copy from previous month"}
        </button>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving || Object.keys(edited).length === 0}
            className="rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <table className="w-full rounded-lg border bg-white text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Budget</th>
            <th className="px-4 py-2 text-right">Actual</th>
            <th className="px-4 py-2 text-right">Remaining</th>
            <th className="px-4 py-2">Progress</th>
          </tr>
        </thead>
        <tbody>
          {expenseRows.length === 0 && (
            <tr>
              <td className="px-4 py-2 text-gray-500" colSpan={5}>
                No categories yet.
              </td>
            </tr>
          )}
          {expenseRows.map((row) => {
            // The synthetic "Uncategorized" row (categoryId: null): actual
            // spend with no category attached, so it can't take a budget.
            if (row.categoryId === null) {
              return (
                <tr key="uncategorized" className="border-b last:border-0">
                  <td className="px-4 py-2">{row.name}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">categorize these to budget them</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(row.actual)}</td>
                  <td className="px-4 py-2 text-right text-gray-400">no budget</td>
                  <td className="px-4 py-2" />
                </tr>
              );
            }

            // Bind to a plain `number` local: a closure captured inside the
            // JSX below (onChange) doesn't retain the `row.categoryId !==
            // null` narrowing done above.
            const categoryId: number = row.categoryId;
            const over = row.budget !== null && row.actual > row.budget;
            const pct =
              row.budget !== null && row.budget > 0
                ? Math.max(0, Math.min(row.actual / row.budget, 1))
                : row.actual > 0
                  ? 1
                  : 0;
            return (
              <tr key={categoryId} className="border-b last:border-0">
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2">
                  <input
                    value={valueFor(categoryId, row.budget)}
                    onChange={(e) => onChange(categoryId, e.target.value)}
                    placeholder="—"
                    inputMode="decimal"
                    className="w-24 rounded border px-2 py-1 text-right tabular-nums"
                  />
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{money(row.actual)}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${over ? "text-red-600" : ""}`}>
                  {row.budget === null ? <span className="text-gray-400">no budget</span> : money(row.remaining)}
                </td>
                <td className="px-4 py-2">
                  {row.budget !== null && (
                    <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
                      <div className={`h-full ${over ? "bg-red-500" : "bg-gray-900"}`} style={{ width: `${pct * 100}%` }} />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-gray-50 font-medium">
            <td className="px-4 py-2">Total</td>
            <td className="px-4 py-2 tabular-nums">{money(totals.budget)}</td>
            <td className="px-4 py-2 text-right tabular-nums">{money(totals.actual)}</td>
            <td className={`px-4 py-2 text-right tabular-nums ${totals.remaining < 0 ? "text-red-600" : ""}`}>
              {money(totals.remaining)}
            </td>
            <td className="px-4 py-2" />
          </tr>
        </tfoot>
      </table>

      {incomeRows.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-500">Income & transfers</h2>
          <table className="w-full rounded-lg border bg-white text-sm">
            <tbody>
              {incomeRows.map((row) => (
                <tr key={row.categoryId ?? row.name} className="border-b last:border-0">
                  <td className="px-4 py-2">{row.name}</td>
                  {/* Plaid convention: positive = out, negative = in. A
                      paycheck posts as a negative net; flip it so income
                      reads as a positive number here. */}
                  <td className="px-4 py-2 text-right tabular-nums">{money(signedAmount(row.actual))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
