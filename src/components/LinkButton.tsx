"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useRouter } from "next/navigation";

export function LinkButton({ itemId, label }: { itemId?: number; label?: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/plaid/link-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId }),
    })
      .then((r) => r.json())
      .then((d) => setToken(d.link_token ?? null))
      .catch(() => setToken(null));
  }, [itemId]);

  const onSuccess = useCallback(
    async (public_token: string | null, metadata: { institution?: { institution_id: string; name: string } | null }) => {
      if (!public_token) return;
      setBusy(true);
      try {
        if (!itemId) {
          await fetch("/api/plaid/exchange", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ public_token, institution: metadata.institution }),
          });
        } else {
          await fetch("/api/sync", { method: "POST" });
        }
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [itemId, router],
  );

  const { open, ready } = usePlaidLink({ token, onSuccess });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || busy}
      className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {busy ? "Working…" : label ?? "Link a bank"}
    </button>
  );
}
