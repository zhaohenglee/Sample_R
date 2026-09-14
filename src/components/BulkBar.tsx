"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: number; name: string };

export function BulkBar({
  selectedIds,
  categories,
  onDone,
}: {
  selectedIds: number[];
  categories: Cat[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string>("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          categoryId: categoryId === "" ? null : Number(categoryId),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Bulk update failed.");
        return;
      }
      onDone();
      router.refresh();
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm">
      <span className="font-medium">{selectedIds.length} selected</span>
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded border px-2 py-1">
        <option value="">Uncategorized</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={applying}
        onClick={apply}
        className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
      >
        {applying ? "Applying…" : "Apply category"}
      </button>
      <button type="button" onClick={onDone} className="px-2 py-1 text-gray-500">
        Clear selection
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
