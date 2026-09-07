"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, signedAmount } from "@/lib/format";

type Cat = { id: number; name: string };

export type TxRow = {
  id: number;
  date: string;
  name: string;
  merchant: string | null;
  displayName: string | null;
  amount: string;
  pending: boolean;
  categoryId: number | null;
  plaidCategory: string | null;
  account: string;
  mask: string | null;
  notes: string | null;
};

// Normalizes a raw edit-panel field the same way the server does, so "did
// this field change" compares like with like (e.g. "" and null are the
// same absence of a value, and surrounding whitespace never counts as a
// change on its own).
function normalizeText(v: string): string | null {
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function TransactionRow({
  t,
  categories,
  selected,
  onToggleSelect,
}: {
  t: TxRow;
  categories: Cat[];
  selected: boolean;
  onToggleSelect: (id: number, checked: boolean) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(t.displayName ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(t.categoryId);
  const [notes, setNotes] = useState(t.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Display name takes over the primary label once set; the name it
  // replaces (merchant, or raw name) shows small underneath instead.
  const primaryLabel = t.merchant ?? t.name;
  const shown = t.displayName ?? primaryLabel;
  const smallLabel = t.displayName ? primaryLabel : t.merchant && t.merchant !== t.name ? t.name : null;
  const categoryName = t.categoryId ? categories.find((c) => c.id === t.categoryId)?.name ?? "—" : "Uncategorized";

  function openEditor() {
    setDisplayName(t.displayName ?? "");
    setCategoryId(t.categoryId);
    setNotes(t.notes ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    // Dirty tracking: only send fields that actually changed against the
    // values the panel was opened with, normalized the same way the server
    // normalizes them. If nothing changed, close without a request.
    const patch: Record<string, string | number | null> = {};
    const nextDisplayName = normalizeText(displayName);
    if (nextDisplayName !== (t.displayName ?? null)) patch.displayName = nextDisplayName;
    if (categoryId !== t.categoryId) patch.categoryId = categoryId;
    const nextNotes = normalizeText(notes);
    if (nextNotes !== (t.notes ?? null)) patch.notes = nextNotes;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Save failed.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <tr className="border-t">
        <td className="px-3 py-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggleSelect(t.id, e.target.checked)}
            aria-label={`Select transaction ${t.id}`}
          />
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-gray-500">{t.date}</td>
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={() => (editing ? setEditing(false) : openEditor())}
            className="text-left hover:underline"
          >
            <div>
              {shown}
              {t.pending && <span className="ml-1 text-xs text-amber-600">pending</span>}
            </div>
          </button>
          {smallLabel && <div className="text-xs text-gray-400">{smallLabel}</div>}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-gray-500">
          {t.account}
          {t.mask ? ` ••${t.mask}` : ""}
        </td>
        <td className="px-3 py-2">
          {categoryName}
          {t.plaidCategory && <div className="mt-0.5 text-[10px] text-gray-400">{t.plaidCategory}</div>}
        </td>
        <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${signedAmount(t.amount) > 0 ? "text-green-700" : ""}`}>
          {money(signedAmount(t.amount))}
        </td>
      </tr>
      {editing && (
        <tr className="border-t bg-gray-50">
          <td colSpan={6} className="px-3 py-3">
            <div className="flex flex-wrap items-end gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Display name</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={primaryLabel}
                  className="rounded border px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Category</span>
                <select
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(e.target.value === "" ? null : Number(e.target.value))}
                  className="rounded border px-2 py-1"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[200px] flex-1 flex-col gap-1">
                <span className="text-xs text-gray-500">Notes</span>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded border px-2 py-1" />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 text-gray-500">
                Cancel
              </button>
              {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
