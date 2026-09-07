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
