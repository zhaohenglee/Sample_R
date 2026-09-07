"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecurringRefreshButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try { await fetch("/api/recurring/refresh", { method: "POST" }); router.refresh(); } finally { setBusy(false); }
      }}
      disabled={busy}
      className="rounded border px-2 py-1 text-xs disabled:opacity-50"
    >
      {busy ? "Refreshing…" : "Refresh"}
    </button>
  );
}
