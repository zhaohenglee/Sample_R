import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { ValidationError } from "@/lib/categories";
import {
  validateTransactionPatch,
  validateBulkCategorizeInput,
  updateTransaction,
  bulkCategorize,
} from "@/lib/transactions";

describe("transactions validation", () => {
  it("rejects an unknown field", () => {
    expect(() => validateTransactionPatch({ nope: 1 })).toThrow(ValidationError);
  });

  it("rejects displayName over 120 characters and accepts exactly 120", () => {
    expect(() => validateTransactionPatch({ displayName: "x".repeat(121) })).toThrow(ValidationError);
    expect(validateTransactionPatch({ displayName: "x".repeat(120) }).displayName).toHaveLength(120);
  });

  it("rejects notes over 1000 characters", () => {
    expect(() => validateTransactionPatch({ notes: "x".repeat(1001) })).toThrow(ValidationError);
    expect(validateTransactionPatch({ notes: "x".repeat(1000) }).notes).toHaveLength(1000);
  });

  it("trims notes like displayName, normalizing whitespace-only to null", () => {
    expect(validateTransactionPatch({ notes: "   " }).notes).toBeNull();
    expect(validateTransactionPatch({ notes: "  hi  " }).notes).toBe("hi");
  });

  it("rejects a non-positive-integer categoryId", () => {
    expect(() => validateTransactionPatch({ categoryId: 0 })).toThrow(ValidationError);
    expect(() => validateTransactionPatch({ categoryId: "1" })).toThrow(ValidationError);
    expect(() => validateTransactionPatch({ categoryId: 1.5 })).toThrow(ValidationError);
  });

  it("rejects an empty patch body", () => {
    expect(() => validateTransactionPatch({})).toThrow(ValidationError);
  });

  it("rejects a malformed body", () => {
    expect(() => validateTransactionPatch(null)).toThrow(ValidationError);
    expect(() => validateTransactionPatch("nope")).toThrow(ValidationError);
    expect(() => validateTransactionPatch([])).toThrow(ValidationError);
  });

  it("rejects an empty ids array", () => {
    expect(() => validateBulkCategorizeInput({ ids: [], categoryId: null })).toThrow(ValidationError);
  });

  it("rejects an ids array over 500 entries", () => {
    const ids = Array.from({ length: 501 }, (_, i) => i + 1);
    expect(() => validateBulkCategorizeInput({ ids, categoryId: null })).toThrow(ValidationError);
    // exactly 500 is fine
    const ok = Array.from({ length: 500 }, (_, i) => i + 1);
    expect(validateBulkCategorizeInput({ ids: ok, categoryId: null }).ids).toHaveLength(500);
  });

  it("dedupes duplicate ids rather than rejecting them", () => {
    const result = validateBulkCategorizeInput({ ids: [1, 2, 2, 1, 3], categoryId: null });
    expect(result.ids).toEqual([1, 2, 3]);
  });

  it("rejects non-integer or string ids", () => {
    expect(() => validateBulkCategorizeInput({ ids: [1, "2"], categoryId: null })).toThrow(ValidationError);
    expect(() => validateBulkCategorizeInput({ ids: [1, 1.5], categoryId: null })).toThrow(ValidationError);
    expect(() => validateBulkCategorizeInput({ ids: [1, 0], categoryId: null })).toThrow(ValidationError);
  });

  it("rejects an unknown field in the bulk body", () => {
    expect(() => validateBulkCategorizeInput({ ids: [1], categoryId: null, extra: true })).toThrow(ValidationError);
  });

  it("requires categoryId to be present in the bulk body", () => {
    expect(() => validateBulkCategorizeInput({ ids: [1] })).toThrow(ValidationError);
  });
});

describe("transactions DB operations", () => {
  let categoryId: number;
  let txId: number;

  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);

    const [category] = await db.insert(schema.categories).values({ name: "Shopping" }).returning();
    categoryId = category.id;
    const [item] = await db.insert(schema.items).values({ plaidItemId: "item-tx-test", accessTokenEnc: encrypt("tok") }).returning();
    const [account] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-tx-test", name: "Checking", type: "depository" })
      .returning();
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId: account.id,
        plaidTransactionId: "tx-test-1",
        date: "2026-09-01",
        amount: "10.00",
        name: "Store",
      })
      .returning();
    txId = tx.id;
  });

  it("updateTransaction sets userEdited and applies the patch", async () => {
    const row = await updateTransaction(txId, { displayName: "My store", categoryId, notes: "hi" });
    expect(row?.userEdited).toBe(true);
    expect(row?.displayName).toBe("My store");
    expect(row?.categoryId).toBe(categoryId);
    expect(row?.notes).toBe("hi");
  });

  it("updateTransaction returns null for a missing id", async () => {
    const row = await updateTransaction(999999, { notes: "hi" });
    expect(row).toBeNull();
  });

  it("updateTransaction throws ValidationError for a non-existent category and leaves the row untouched", async () => {
    await expect(updateTransaction(txId, { categoryId: 999999 })).rejects.toBeInstanceOf(ValidationError);
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, txId));
    expect(row.categoryId).toBeNull();
    expect(row.userEdited).toBe(false);
  });

  it("bulkCategorize updates the given rows and marks them userEdited", async () => {
    const updated = await bulkCategorize({ ids: [txId], categoryId });
    expect(updated).toBe(1);
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, txId));
    expect(row.categoryId).toBe(categoryId);
    expect(row.userEdited).toBe(true);
  });

  it("bulkCategorize with a non-existent category throws ValidationError and changes no rows", async () => {
    await expect(bulkCategorize({ ids: [txId], categoryId: 999999 })).rejects.toBeInstanceOf(ValidationError);
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, txId));
    expect(row.categoryId).toBeNull();
    expect(row.userEdited).toBe(false);
  });
});
