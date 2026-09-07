"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";

export type AccountRowData = {
  id: number;
  name: string;
  nickname: string | null;
  mask: string | null;
  type: string;
  subtype: string | null;
  currentBalance: string | null;
  currency: string | null;
  hidden: boolean;
  excludeFromTotals: boolean;
};

// One editable account row: nickname, hidden, and exclude-from-totals are
// each saved with a PATCH to /api/accounts/[id] followed by router.refresh()
// so the dashboard and transactions page pick up the change immediately.
export function AccountRow({ account }: { account: AccountRowData }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(account.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
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

  function saveNickname() {
    const trimmed = nickname.trim();
    const next = trimmed === "" ? null : trimmed;
    if (next === (account.nickname ?? null)) return;
    patch({ nickname: next });
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onBlur={saveNickname}
          placeholder={account.name}
          disabled={saving}
          className="w-full min-w-[10rem] rounded border px-2 py-1 text-sm"
        />
        <div className="mt-0.5 text-xs text-gray-400">
          {account.name}
          {account.mask ? ` ••${account.mask}` : ""}
        </div>
      </td>
      <td className="px-4 py-2 text-gray-500">{account.subtype ?? account.type}</td>
      <td className="px-4 py-2 text-right tabular-nums">{money(account.currentBalance, account.currency ?? "USD")}</td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={account.hidden}
          disabled={saving}
          onChange={(e) => patch({ hidden: e.target.checked })}
          aria-label={`Hide ${account.name}`}
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={account.excludeFromTotals}
          disabled={saving}
          onChange={(e) => patch({ excludeFromTotals: e.target.checked })}
          aria-label={`Exclude ${account.name} from totals`}
        />
      </td>
      <td className="px-4 py-2 text-xs text-red-600">{error}</td>
    </tr>
  );
}
