"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Calls Plaid /item/remove via DELETE /api/items/[id]. A confirm dialog
// warns that this removes the connection everywhere. A 502 (Plaid failure)
// leaves local data intact -- shown as an inline error rather than treated
// like success.
export function UnlinkButton({ itemId, institutionName }: { itemId: number; institutionName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlink() {
    const ok = window.confirm(
      `Unlink ${institutionName}? This removes the connection at the bank and deletes its accounts and transactions from this app. This cannot be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={unlink}
        disabled={busy}
        className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "Unlinking…" : "Unlink"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
