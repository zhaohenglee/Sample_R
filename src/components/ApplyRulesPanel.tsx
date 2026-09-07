"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApplyResult = { matched: number; changed: number };

// "Apply rules to existing transactions" panel: Preview runs a dry run and
// shows the count that would change; Apply is only enabled once a preview
// has been run (so a real backfill is never fired blind), and re-runs for
// real against the same includeEdited setting.
export function ApplyRulesPanel() {
  const router = useRouter();
  const [includeEdited, setIncludeEdited] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(dryRun: boolean): Promise<ApplyResult> {
    const res = await fetch("/api/rules/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ includeEdited, dryRun }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
    return data as ApplyResult;
  }

  function onToggleIncludeEdited(checked: boolean) {
    setIncludeEdited(checked);
    // Any change to the scope invalidates a prior preview: Apply must not
    // run for real against a count that no longer matches its settings.
    setPreviewCount(null);
    setResult(null);
  }

  async function preview() {
    setPreviewing(true);
    setError(null);
    setResult(null);
    try {
      const r = await run(true);
      setPreviewCount(r.changed);
    } catch (e) {
      setPreviewCount(null);
      setError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewing(false);
    }
  }

  async function apply() {
    setApplying(true);
    setError(null);
    try {
      const r = await run(false);
      setResult(r);
      setPreviewCount(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-2 text-sm font-medium text-gray-700">Apply rules to existing transactions</h2>
      <p className="mb-3 text-xs text-gray-500">
        Runs every enabled rule, in priority order, against all transactions and sets category (and display name,
        when the rule specifies one) on the first match.
      </p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeEdited}
            onChange={(e) => onToggleIncludeEdited(e.target.checked)}
          />
          Include manually edited transactions (their category and display name will be replaced)
        </label>
        <button
          type="button"
          onClick={preview}
          disabled={previewing}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          {previewing ? "Previewing…" : "Preview"}
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={applying || previewCount === null}
          title={previewCount === null ? "Preview first" : undefined}
          className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
        >
          {applying ? "Applying…" : "Apply"}
        </button>
        {previewCount !== null && (
          <span className="text-xs text-gray-600">This will change {previewCount} transactions.</span>
        )}
        {result && (
          <span className="text-xs text-green-700">
            Changed {result.changed} of {result.matched} matched.
          </span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
