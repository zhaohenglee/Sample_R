"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AccountOption = { id: number; label: string };

type Goal = {
  id: number;
  name: string;
  accountId: number | null;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
};

// Single row: creates a goal when `goal` is omitted, otherwise edits or
// deletes the given one. Mirrors CategoryEditor's create-vs-edit shape.
export function GoalEditor({
  goal,
  accountOptions,
}: {
  goal?: Goal;
  accountOptions: AccountOption[];
}) {
  const router = useRouter();
  const isNew = !goal;
  const [name, setName] = useState(goal?.name ?? "");
  const [accountId, setAccountId] = useState(goal?.accountId != null ? String(goal.accountId) : "");
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount ?? "");
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount ?? "0");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLinked = accountId !== "";

  async function save(e: FormEvent) {
    e.preventDefault();
    const amount = Number(targetAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Target amount must be a positive number.");
      return;
    }
    const current = Number(currentAmount || "0");
    if (!Number.isFinite(current) || current < 0) {
      setError("Current amount must be a number >= 0.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        accountId: accountId === "" ? null : Number(accountId),
        targetAmount: amount,
        currentAmount: current,
        targetDate: targetDate === "" ? null : targetDate,
      };
      const res = await fetch(isNew ? "/api/goals" : `/api/goals/${goal!.id}`, {
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
        setAccountId("");
        setTargetAmount("");
        setCurrentAmount("0");
        setTargetDate("");
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!goal) return;
    const ok = window.confirm(`Delete goal "${goal.name}"? This does not affect any linked account.`);
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
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
    <form onSubmit={save} className="flex flex-wrap items-end gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency fund"
          required
          className="min-w-[10rem] rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Linked account</span>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="rounded border px-2 py-1">
          <option value="">None (track manually)</option>
          {accountOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Target amount</span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
          className="w-28 rounded border px-2 py-1"
        />
      </label>
      {!isLinked && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Current amount</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            className="w-28 rounded border px-2 py-1"
          />
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Target date (optional)</span>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="rounded border px-2 py-1"
        />
      </label>
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
