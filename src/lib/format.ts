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
