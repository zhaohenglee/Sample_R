"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Option = { id: number; name: string };

type RuleField = "name" | "merchant_name" | "any";
type RuleMatch = "contains" | "starts_with" | "regex";

type Rule = {
  id: number;
  name: string;
  field: string;
  match: string;
  pattern: string;
  amountMin: string | null;
  amountMax: string | null;
  accountId: number | null;
  categoryId: number;
  setDisplayName: string | null;
  priority: number;
  enabled: boolean;
};

// Prefill for a brand-new rule, e.g. from the transactions page's "Create
// rule from this transaction" link. Only meaningful when `rule` is omitted.
export type RulePrefill = {
  field: RuleField;
  match: RuleMatch;
  pattern: string;
  categoryId?: string;
};

// Single row: creates a rule when `rule` is omitted, otherwise edits or
// deletes the given one. Mirrors CategoryEditor's shape.
export function RuleEditor({
  rule,
  categoryOptions,
  accountOptions,
  prefill,
}: {
  rule?: Rule;
  categoryOptions: Option[];
  accountOptions: Option[];
  prefill?: RulePrefill;
}) {
  const router = useRouter();
  const isNew = !rule;

  const [name, setName] = useState(rule?.name ?? "");
  const [field, setField] = useState<RuleField>((rule?.field as RuleField) ?? prefill?.field ?? "name");
  const [match, setMatch] = useState<RuleMatch>((rule?.match as RuleMatch) ?? prefill?.match ?? "contains");
  const [pattern, setPattern] = useState(rule?.pattern ?? prefill?.pattern ?? "");
  const [amountMin, setAmountMin] = useState(rule?.amountMin ?? "");
  const [amountMax, setAmountMax] = useState(rule?.amountMax ?? "");
  const [accountId, setAccountId] = useState(rule?.accountId != null ? String(rule.accountId) : "");
  const [categoryId, setCategoryId] = useState(
    rule?.categoryId != null ? String(rule.categoryId) : prefill?.categoryId ?? "",
  );
  const [setDisplayName, setSetDisplayName] = useState(rule?.setDisplayName ?? "");
  const [priority, setPriority] = useState(String(rule?.priority ?? 100));
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ matched: number; changed: number } | null>(null);

  function reset() {
    setName("");
    setField("name");
    setMatch("contains");
    setPattern("");
    setAmountMin("");
    setAmountMax("");
    setAccountId("");
    setCategoryId("");
    setSetDisplayName("");
    setPriority("100");
    setEnabled(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!categoryId) {
        setError("category is required.");
        return;
      }
      const body = {
        name,
        field,
        match,
        pattern,
        amountMin: amountMin.trim() === "" ? null : Number(amountMin),
        amountMax: amountMax.trim() === "" ? null : Number(amountMax),
        accountId: accountId === "" ? null : Number(accountId),
        categoryId: Number(categoryId),
        setDisplayName: setDisplayName.trim() === "" ? null : setDisplayName.trim(),
        priority: Number(priority),
        enabled,
      };
      const res = await fetch(isNew ? "/api/rules" : `/api/rules/${rule!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      if (isNew) reset();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function applyThisRule() {
    if (!rule) return;
    setSaving(true);
    setError(null);
    setApplyResult(null);
    try {
      const res = await fetch("/api/rules/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ruleId: rule.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setApplyResult(data);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!rule) return;
    const ok = window.confirm(`Delete rule "${rule.name}"?`);
    if (!ok) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/rules/${rule.id}`, { method: "DELETE" });
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
        placeholder="Rule name"
        required
        className="w-32 rounded border px-2 py-1"
      />
      <select value={field} onChange={(e) => setField(e.target.value as RuleField)} className="rounded border px-2 py-1">
        <option value="name">name</option>
        <option value="merchant_name">merchant_name</option>
        <option value="any">any</option>
      </select>
      <select value={match} onChange={(e) => setMatch(e.target.value as RuleMatch)} className="rounded border px-2 py-1">
        <option value="contains">contains</option>
        <option value="starts_with">starts_with</option>
        <option value="regex">regex</option>
      </select>
      <input
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder="Pattern"
        required
        className="w-36 rounded border px-2 py-1 font-mono text-xs"
      />
      <input
        value={amountMin}
        onChange={(e) => setAmountMin(e.target.value)}
        placeholder="Min $"
        type="number"
        step="0.01"
        className="w-20 rounded border px-2 py-1"
      />
      <input
        value={amountMax}
        onChange={(e) => setAmountMax(e.target.value)}
        placeholder="Max $"
        type="number"
        step="0.01"
        className="w-20 rounded border px-2 py-1"
      />
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="rounded border px-2 py-1">
        <option value="">Any account</option>
        {accountOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
        className="rounded border px-2 py-1"
      >
        <option value="">Category</option>
        {categoryOptions.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <input
        value={setDisplayName}
        onChange={(e) => setSetDisplayName(e.target.value)}
        placeholder="Set display name (optional)"
        className="w-40 rounded border px-2 py-1"
      />
      <input
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        placeholder="Priority"
        type="number"
        title="Lower number runs first"
        className="w-16 rounded border px-2 py-1"
      />
      <label className="flex items-center gap-1 text-xs text-gray-600">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>
      <button disabled={saving} className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50">
        {isNew ? "Add" : "Save"}
      </button>
      {!isNew && (
        <button
          type="button"
          onClick={applyThisRule}
          disabled={saving}
          className="rounded border px-2 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Apply this rule
        </button>
      )}
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
      {applyResult && (
        <span className="text-xs text-green-700">
          Changed {applyResult.changed} of {applyResult.matched} matched.
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
