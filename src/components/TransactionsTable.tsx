"use client";

import { useState } from "react";
import { TransactionRow, type TxRow } from "@/components/TransactionRow";
import { BulkBar } from "@/components/BulkBar";

type Cat = { id: number; name: string };

// Holds the checkbox-selection state shared between each TransactionRow and
// the BulkBar that appears once anything is checked.
export function TransactionsTable({ rows, categories }: { rows: TxRow[]; categories: Cat[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <BulkBar selectedIds={[...selected]} categories={categories} onDone={() => setSelected(new Set())} />
      )}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-gray-500">
                  No transactions.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <TransactionRow key={t.id} t={t} categories={categories} selected={selected.has(t.id)} onToggleSelect={toggle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
