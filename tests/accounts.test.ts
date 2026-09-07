import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { ValidationError } from "@/lib/categories";
import {
  validateAccountPatch,
  updateAccount,
  unlinkItem,
  PlaidRemoveError,
  type PlaidRemoveClient,
} from "@/lib/accounts";

describe("account patch validation", () => {
  it("rejects an unknown field", () => {
    expect(() => validateAccountPatch({ nope: 1 })).toThrow(ValidationError);
  });

  it("rejects an empty patch body", () => {
    expect(() => validateAccountPatch({})).toThrow(ValidationError);
  });

  it("rejects a malformed body", () => {
    expect(() => validateAccountPatch(null)).toThrow(ValidationError);
    expect(() => validateAccountPatch("nope")).toThrow(ValidationError);
    expect(() => validateAccountPatch([])).toThrow(ValidationError);
  });

  it("accepts a null nickname", () => {
    expect(validateAccountPatch({ nickname: null }).nickname).toBeNull();
  });

  it("trims nickname and rejects empty or over-long values", () => {
    expect(validateAccountPatch({ nickname: "  My checking  " }).nickname).toBe("My checking");
    expect(() => validateAccountPatch({ nickname: "" })).toThrow(ValidationError);
    expect(() => validateAccountPatch({ nickname: "   " })).toThrow(ValidationError);
    expect(() => validateAccountPatch({ nickname: "x".repeat(61) })).toThrow(ValidationError);
    expect(validateAccountPatch({ nickname: "x".repeat(60) }).nickname).toHaveLength(60);
  });

  it("rejects a non-string, non-null nickname", () => {
    expect(() => validateAccountPatch({ nickname: 5 })).toThrow(ValidationError);
  });

  it("requires hidden to be strictly boolean", () => {
    expect(validateAccountPatch({ hidden: true }).hidden).toBe(true);
    expect(validateAccountPatch({ hidden: false }).hidden).toBe(false);
    expect(() => validateAccountPatch({ hidden: "true" })).toThrow(ValidationError);
    expect(() => validateAccountPatch({ hidden: 1 })).toThrow(ValidationError);
  });

  it("requires excludeFromTotals to be strictly boolean", () => {
    expect(validateAccountPatch({ excludeFromTotals: true }).excludeFromTotals).toBe(true);
    expect(() => validateAccountPatch({ excludeFromTotals: "yes" })).toThrow(ValidationError);
    expect(() => validateAccountPatch({ excludeFromTotals: 0 })).toThrow(ValidationError);
  });

  it("accepts multiple allowed fields together", () => {
    const out = validateAccountPatch({ nickname: "Joint", hidden: true, excludeFromTotals: true });
    expect(out).toEqual({ nickname: "Joint", hidden: true, excludeFromTotals: true });
  });
});

describe("accounts DB operations", () => {
  let itemId: number;
  let accountId: number;
  let txId: number;

  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);

    const [item] = await db
      .insert(schema.items)
      .values({ plaidItemId: "item-acct-test", accessTokenEnc: encrypt("tok-123"), institutionName: "Test Bank" })
      .returning();
    itemId = item.id;
    const [account] = await db
      .insert(schema.accounts)
      .values({ itemId, plaidAccountId: "acc-acct-test", name: "Checking", type: "depository" })
      .returning();
    accountId = account.id;
    const [tx] = await db
      .insert(schema.transactions)
      .values({ accountId, plaidTransactionId: "tx-acct-test-1", date: "2026-09-01", amount: "10.00", name: "Store" })
      .returning();
    txId = tx.id;
  });

  it("updateAccount sets fields and returns null for a missing id", async () => {
    const row = await updateAccount(accountId, { nickname: "My checking", hidden: true, excludeFromTotals: true });
    expect(row?.nickname).toBe("My checking");
    expect(row?.hidden).toBe(true);
    expect(row?.excludeFromTotals).toBe(true);

    const missing = await updateAccount(999999, { hidden: true });
    expect(missing).toBeNull();
  });

  it("unlinkItem deletes the item, its accounts, and its transactions when Plaid succeeds", async () => {
    const fakeClient: PlaidRemoveClient = {
      itemRemove: async () => ({ data: {} }),
    };
    const removed = await unlinkItem(itemId, fakeClient);
    expect(removed).toBe(true);

    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, itemId));
    expect(item).toBeUndefined();
    const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, accountId));
    expect(account).toBeUndefined();
    const [tx] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, txId));
    expect(tx).toBeUndefined();
  });

  it("unlinkItem throws PlaidRemoveError and leaves everything intact when Plaid fails", async () => {
    const fakeClient: PlaidRemoveClient = {
      itemRemove: async () => {
        const err = { response: { data: { error_code: "PLANNED_MAINTENANCE", error_message: "try again later" } } };
        throw err;
      },
    };
    await expect(unlinkItem(itemId, fakeClient)).rejects.toBeInstanceOf(PlaidRemoveError);
    await expect(unlinkItem(itemId, fakeClient)).rejects.toMatchObject({ errorCode: "PLANNED_MAINTENANCE" });

    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, itemId));
    expect(item).toBeDefined();
    const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, accountId));
    expect(account).toBeDefined();
    const [tx] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, txId));
    expect(tx).toBeDefined();
  });

  it("unlinkItem treats a Plaid ITEM_NOT_FOUND error as success and deletes everything locally", async () => {
    const fakeClient: PlaidRemoveClient = {
      itemRemove: async () => {
        const err = { response: { data: { error_code: "ITEM_NOT_FOUND", error_message: "item not found" } } };
        throw err;
      },
    };
    const removed = await unlinkItem(itemId, fakeClient);
    expect(removed).toBe(true);

    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, itemId));
    expect(item).toBeUndefined();
    const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, accountId));
    expect(account).toBeUndefined();
    const [tx] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, txId));
    expect(tx).toBeUndefined();
  });

  it("unlinkItem returns false for a missing item id", async () => {
    const fakeClient: PlaidRemoveClient = { itemRemove: async () => ({}) };
    const removed = await unlinkItem(999999, fakeClient);
    expect(removed).toBe(false);
  });
});
