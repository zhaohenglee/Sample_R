export function money(v: string | number | null | undefined, currency = "USD"): string {
  if (v === null || v === undefined) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

// Plaid: positive = money out. Display as signed with outflow negative.
export function signedAmount(v: string | number): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return -n;
}

// Everywhere an account name is shown, the user's nickname (when set)
// takes over from the Plaid-supplied name.
export function accountLabel(a: { name: string; nickname?: string | null }): string {
  return a.nickname ?? a.name;
}

// items.status values and how to show each one. `needsFix` controls whether
// the "Fix" (re-link) button is offered next to the label.
export type ItemStatusInfo = { label: string; needsFix: boolean };

export function itemStatusInfo(item: { status: string; lastError: string | null }): ItemStatusInfo {
  switch (item.status) {
    case "ok":
      return { label: "OK", needsFix: false };
    case "login_required":
      return { label: "Needs re-login", needsFix: true };
    case "pending_expiration":
      return { label: "Access expires soon, re-link to keep syncing", needsFix: true };
    case "new_accounts_available":
      return { label: "New accounts available at this bank", needsFix: true };
    case "revoked":
      return { label: "Access revoked at the bank, unlink and link again", needsFix: false };
    case "error":
      return { label: item.lastError ?? "Error", needsFix: true };
    default:
      return { label: item.lastError ?? "Error", needsFix: true };
  }
}
