"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "depository", label: "Depository (checking/savings)" },
  { value: "credit", label: "Credit card" },
  { value: "loan", label: "Loan" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

// Collapsed to a single "Add manual account" button; expands into an
// inline form on click. Posts to POST /api/accounts, which creates the
// account's own dedicated item shell alongside it (see src/lib/manual.ts).
export function ManualAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("depository");
  const [subtype, setSubtype] = useState("");
  const [startingBalance, setStartingBalance] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setType("depository");
    setSubtype("");
    setStartingBalance("0");
    setCurrency("USD");
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const balance = Number(startingBalance);
    if (!Number.isFinite(balance)) {
      setError("Starting balance must be a number.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          subtype: subtype.trim() === "" ? null : subtype.trim(),
          startingBalance: balance,
          currency: currency.trim().toUpperCase() || "USD",
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Add manual account
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cash wallet"
          required
          className="w-40 rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border px-2 py-1">
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Subtype (optional)</span>
        <input
          value={subtype}
          onChange={(e) => setSubtype(e.target.value)}
          placeholder="e.g. savings"
          className="w-32 rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Starting balance</span>
        <input
          type="number"
          step="0.01"
          value={startingBalance}
          onChange={(e) => setStartingBalance(e.target.value)}
          className="w-28 rounded border px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Currency</span>
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          maxLength={3}
          className="w-16 rounded border px-2 py-1 uppercase"
        />
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
