"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AccountOption = { id: number; name: string; nickname: string | null };
type Cat = { id: number; name: string };

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Collapsed to a single "Add transaction" button; expands into an inline
// form on click. `accounts` is pre-filtered by the page to manual accounts
// only -- Plaid transactions never come from this form. The amount the
// user types is always a positive magnitude; `direction` flips it to
// Plaid's sign convention (positive = money out) server side.
export function ManualTransactionForm({ accounts, categories }: { accounts: AccountOption[]; categories: Cat[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState(accounts[0] ? String(accounts[0].id) : "");
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"out" | "in">("out");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAccountId(accounts[0] ? String(accounts[0].id) : "");
    setDate(todayIso());
    setDescription("");
    setAmount("");
    setDirection("out");
    setCategoryId("");
    setNotes("");
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accountId: Number(accountId),
          date,
          description,
          amount: amountNum,
          direction,
          categoryId: categoryId === "" ? null : Number(categoryId),
          notes: notes.trim() === "" ? null : notes.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        <a href="/accounts" className="underline">Add a manual account</a> to record transactions by hand.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Add transaction
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Account</span>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="rounded border px-2 py-1">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.nickname ?? a.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <span className="text-xs text-gray-500">Description</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Farmers market"
          required
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Amount</span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-28 rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Direction</span>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as "out" | "in")}
          className="rounded border px-2 py-1"
        >
          <option value="out">Spending (money out)</option>
          <option value="in">Income (money in)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Category</span>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded border px-2 py-1">
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <span className="text-xs text-gray-500">Notes</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded border px-2 py-1" />
      </label>
      <button disabled={saving} className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50">
        {saving ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(false);
        }}
        className="px-2 py-1 text-gray-500"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
