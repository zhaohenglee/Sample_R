"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type Account = { id: number; name: string; mask: string | null };
type PreviewRow =
  | { line: number; ok: true; date: string; description: string; amount: number }
  | { line: number; ok: false; error: string };
type PreviewResult = {
  imported: number;
  skippedDuplicates: number;
  errors: { line: number; error: string }[];
  headers: string[];
  totalRows: number;
  preview: PreviewRow[];
};

const DATE_FORMATS = [
  { value: "iso", label: "YYYY-MM-DD" },
  { value: "us", label: "MM/DD/YYYY" },
  { value: "eu", label: "DD/MM/YYYY" },
];

function money(n: number): string {
  // Stored convention is positive = money out, so flip for display.
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(-n);
}

// Three steps on one page: choose a file and an account, map the columns
// (with a live preview), then commit. The file never leaves the browser
// until commit; preview and commit both send the same text so the server
// re-parses rather than trusting a client-side parse.
export function ImportWizard({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [headers, setHeaders] = useState<string[]>([]);

  const [dateColumn, setDateColumn] = useState(0);
  const [dateFormat, setDateFormat] = useState("iso");
  const [descriptionColumn, setDescriptionColumn] = useState(1);
  const [amountMode, setAmountMode] = useState<"single" | "debit_credit">("single");
  const [amountColumn, setAmountColumn] = useState(2);
  const [signConvention, setSignConvention] = useState("expense_positive");
  const [debitColumn, setDebitColumn] = useState(2);
  const [creditColumn, setCreditColumn] = useState(3);

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ imported: number; skippedDuplicates: number; categorized: number } | null>(null);

  function mapping() {
    return amountMode === "single"
      ? { dateColumn, dateFormat, descriptionColumn, amountMode, amountColumn, signConvention }
      : { dateColumn, dateFormat, descriptionColumn, amountMode, debitColumn, creditColumn };
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setDone(null);
    setPreview(null);
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    // Show the header row immediately so the column pickers are usable
    // before the first preview round trip.
    const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
    setHeaders(firstLine.split(",").map((h) => h.replace(/^"|"$/g, "").trim()));
  }

  async function run(path: string): Promise<Response> {
    return fetch(`/api/import/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId, csv, mapping: mapping() }),
    });
  }

  async function doPreview() {
    if (!csv || accountId === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await run("preview");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Preview failed.");
        setPreview(null);
      } else {
        setPreview(data);
        setHeaders(data.headers);
      }
    } finally {
      setBusy(false);
    }
  }

  async function doCommit() {
    if (!csv || accountId === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await run("commit");
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Import failed.");
      else {
        setDone(data);
        setPreview(null);
        setCsv(null);
        setFileName(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        CSV rows import into a manual account. Create one on the{" "}
        <a href="/accounts" className="underline">Accounts</a> page first.
      </p>
    );
  }

  const columnOptions = headers.map((h, i) => (
    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
  ));

  return (
    <div className="space-y-6">
      {done && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm">
          Imported {done.imported} transaction{done.imported === 1 ? "" : "s"}
          {done.skippedDuplicates > 0 && `, skipped ${done.skippedDuplicates} duplicate${done.skippedDuplicates === 1 ? "" : "s"}`}
          {done.categorized > 0 && `, categorized ${done.categorized} by rules`}.{" "}
          <a href="/transactions" className="underline">View transactions</a>
        </div>
      )}

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">1. File and account</h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
          <select
            value={accountId ?? ""}
            onChange={(e) => setAccountId(Number(e.target.value))}
            className="rounded border px-2 py-1"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}{a.mask ? ` ••${a.mask}` : ""}</option>
            ))}
          </select>
          {fileName && <span className="text-gray-500">{fileName}</span>}
        </div>
      </section>

      {csv && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">2. Map the columns</h2>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <label className="flex items-center gap-2">
              <span className="w-28 text-gray-600">Date</span>
              <select value={dateColumn} onChange={(e) => setDateColumn(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">{columnOptions}</select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-28 text-gray-600">Date format</span>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="flex-1 rounded border px-2 py-1">
                {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-28 text-gray-600">Description</span>
              <select value={descriptionColumn} onChange={(e) => setDescriptionColumn(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">{columnOptions}</select>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-28 text-gray-600">Amount style</span>
              <select value={amountMode} onChange={(e) => setAmountMode(e.target.value as "single" | "debit_credit")} className="flex-1 rounded border px-2 py-1">
                <option value="single">One amount column</option>
                <option value="debit_credit">Separate debit and credit</option>
              </select>
            </label>

            {amountMode === "single" ? (
              <>
                <label className="flex items-center gap-2">
                  <span className="w-28 text-gray-600">Amount</span>
                  <select value={amountColumn} onChange={(e) => setAmountColumn(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">{columnOptions}</select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-28 text-gray-600">Positive means</span>
                  <select value={signConvention} onChange={(e) => setSignConvention(e.target.value)} className="flex-1 rounded border px-2 py-1">
                    <option value="expense_positive">Spending</option>
                    <option value="income_positive">Income</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2">
                  <span className="w-28 text-gray-600">Debit (out)</span>
                  <select value={debitColumn} onChange={(e) => setDebitColumn(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">{columnOptions}</select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-28 text-gray-600">Credit (in)</span>
                  <select value={creditColumn} onChange={(e) => setCreditColumn(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">{columnOptions}</select>
                </label>
              </>
            )}
          </div>
          <button onClick={doPreview} disabled={busy} className="mt-4 rounded bg-gray-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {busy ? "Checking…" : "Preview"}
          </button>
        </section>
      )}

      {error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {preview && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">3. Review and import</h2>
          <p className="mb-3 text-sm text-gray-600">
            {preview.totalRows} row{preview.totalRows === 1 ? "" : "s"} in the file. {preview.imported} to import,{" "}
            {preview.skippedDuplicates} duplicate{preview.skippedDuplicates === 1 ? "" : "s"} already in this account,{" "}
            {preview.errors.length} unreadable.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-3 py-2">Line</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {preview.preview.map((r) =>
                  r.ok ? (
                    <tr key={r.line} className="border-t">
                      <td className="px-3 py-1.5 text-gray-400">{r.line}</td>
                      <td className="px-3 py-1.5">{r.date}</td>
                      <td className="px-3 py-1.5">{r.description}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${r.amount < 0 ? "text-green-700" : ""}`}>{money(r.amount)}</td>
                    </tr>
                  ) : (
                    <tr key={r.line} className="border-t bg-red-50">
                      <td className="px-3 py-1.5 text-gray-400">{r.line}</td>
                      <td colSpan={3} className="px-3 py-1.5 text-red-700">{r.error}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {preview.errors.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-gray-600">{preview.errors.length} row(s) could not be read</summary>
              <ul className="mt-2 space-y-1 text-red-700">
                {preview.errors.slice(0, 50).map((e) => <li key={e.line}>Line {e.line}: {e.error}</li>)}
              </ul>
            </details>
          )}

          <button onClick={doCommit} disabled={busy || preview.imported === 0} className="mt-4 rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {busy ? "Importing…" : `Import ${preview.imported} transaction${preview.imported === 1 ? "" : "s"}`}
          </button>
        </section>
      )}
    </div>
  );
}
