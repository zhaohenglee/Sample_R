"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        setBusy(true);
        try { await fetch("/api/sync", { method: "POST" }); router.refresh(); } finally { setBusy(false); }
      }}
      disabled={busy}
      className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
    >
      {busy ? "Syncing…" : "Sync now"}
    </button>
  );
}
