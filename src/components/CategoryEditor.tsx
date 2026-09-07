"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Option = { id: number; name: string };

type Category = {
  id: number;
  name: string;
  parentId: number | null;
  plaidPrimary: string | null;
};

// Single row: creates a category when `category` is omitted, otherwise
// edits (rename, reparent, set Plaid primary) or deletes the given one.
export function CategoryEditor({
  category,
  parentOptions,
  disableParent,
  plaidPrimaryOptions,
}: {
  category?: Category;
  parentOptions: Option[];
  disableParent?: boolean;
  plaidPrimaryOptions?: string[];
}) {
  const router = useRouter();
  const plaidListId = useId();
  const isNew = !category;
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState(category?.parentId != null ? String(category.parentId) : "");
  const [plaidPrimary, setPlaidPrimary] = useState(category?.plaidPrimary ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        parentId: parentId === "" ? null : Number(parentId),
        plaidPrimary: plaidPrimary.trim() === "" ? null : plaidPrimary.trim(),
      };
      const res = await fetch(isNew ? "/api/categories" : `/api/categories/${category!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (isNew) {
        setName("");
        setParentId("");
        setPlaidPrimary("");
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!category) return;
    const ok = window.confirm(
      `Delete "${category.name}"? Transactions in this category will become uncategorized, any subcategories will move to top level, and any rules pointing at this category will be deleted too.`,
    );
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2 text-sm">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Category name"
        required
        className="min-w-[10rem] flex-1 rounded border px-2 py-1"
      />
      <select
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
        disabled={disableParent}
        title={disableParent ? "This category has subcategories of its own and cannot be nested." : undefined}
        className="rounded border px-2 py-1 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">Top level</option>
        {parentOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <input
        value={plaidPrimary}
        onChange={(e) => setPlaidPrimary(e.target.value)}
        placeholder="Plaid primary (optional)"
        list={plaidPrimaryOptions?.length ? plaidListId : undefined}
        className="w-48 rounded border px-2 py-1 font-mono text-xs"
      />
      {plaidPrimaryOptions && plaidPrimaryOptions.length > 0 && (
        <datalist id={plaidListId}>
          {plaidPrimaryOptions.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      )}
      <button disabled={saving} className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50">
        {isNew ? "Add" : "Save"}
      </button>
      {!isNew && (
        <button
          type="button"
          onClick={remove}
          disabled={saving}
          className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
