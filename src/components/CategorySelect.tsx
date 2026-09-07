"use client";

import { useState } from "react";

type Cat = { id: number; name: string };

export function CategorySelect({ txId, value, categories }: { txId: number; value: number | null; categories: Cat[] }) {
  const [current, setCurrent] = useState<number | null>(value);
  const [saving, setSaving] = useState(false);
  return (
    <select
      value={current ?? ""}
      disabled={saving}
      onChange={async (e) => {
        const next = e.target.value === "" ? null : Number(e.target.value);
        setCurrent(next);
        setSaving(true);
        try {
          await fetch(`/api/transactions/${txId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ categoryId: next }),
          });
        } finally { setSaving(false); }
      }}
      className="rounded border bg-white px-1 py-0.5 text-xs"
    >
      <option value="">Uncategorized</option>
      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}
