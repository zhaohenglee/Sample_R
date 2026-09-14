// The page and the export share one normalizer so they cannot disagree
// about what a URL means, and so a malformed filter is ignored rather than
// answering 500. Validation found `?account=abc` returning 500 and
// `?q=a&q=b` filtering differently in each caller.
import { describe, it, expect } from "vitest";
import { normalizeTransactionListParams } from "@/lib/transactions";

describe("normalizeTransactionListParams", () => {
  it("passes through well formed filters", () => {
    expect(normalizeTransactionListParams({
      q: "coffee", account: "3", category: "7", from: "2026-01-01", to: "2026-12-31",
    })).toEqual({ q: "coffee", account: "3", category: "7", from: "2026-01-01", to: "2026-12-31" });
  });

  it("ignores a malformed account or category instead of throwing", () => {
    expect(normalizeTransactionListParams({ account: "abc" }).account).toBeUndefined();
    expect(normalizeTransactionListParams({ account: "999999999999" }).account).toBeUndefined();
    expect(normalizeTransactionListParams({ account: "-1" }).account).toBeUndefined();
    expect(normalizeTransactionListParams({ category: "abc" }).category).toBeUndefined();
  });

  it("keeps the uncategorized sentinel", () => {
    expect(normalizeTransactionListParams({ category: "none" }).category).toBe("none");
  });

  it("ignores a malformed date", () => {
    expect(normalizeTransactionListParams({ from: "notadate" }).from).toBeUndefined();
    expect(normalizeTransactionListParams({ to: "2026-13-45" }).to).toBeUndefined();
    expect(normalizeTransactionListParams({ from: "2026-02-30" }).from).toBeUndefined();
  });

  it("takes the first value of a repeated parameter, in every caller alike", () => {
    expect(normalizeTransactionListParams({ q: ["a", "b"] }).q).toBe("a");
    expect(normalizeTransactionListParams({ account: ["1", "2"] }).account).toBe("1");
  });

  it("treats an empty or whitespace-only search as absent", () => {
    expect(normalizeTransactionListParams({ q: "" }).q).toBeUndefined();
    expect(normalizeTransactionListParams({ q: "   " }).q).toBeUndefined();
  });
});
