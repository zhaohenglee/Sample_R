import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { upsertAccounts, upsertTransactions, markRemoved } from "@/lib/sync";
import { ensureDefaultCategories } from "@/lib/categories";

// Ported from the manual integration script (synctest.ts). Tests run
// serially (see vitest.config.ts) and share state within this describe
// block because each step builds on the sync state left by the last one,
// mirroring a real transactions/sync cursor loop.
describe("sync", () => {
  let itemId: number;
  const accessToken = "access-sandbox-abc";

  const pending = {
    transaction_id: "p1",
    account_id: "acc1",
    date: "2026-09-01",
    amount: 12.5,
    name: "STARBUCKS",
    merchant_name: "Starbucks",
    pending: true,
    personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE" },
  } as any;

  it("crypto round trip", () => {
    expect(decrypt(encrypt(accessToken))).toBe(accessToken);
  });

  beforeAll(async () => {
    await ensureDefaultCategories();
    const [item] = await db.insert(schema.items).values({ plaidItemId: "item1", accessTokenEnc: encrypt(accessToken) }).returning();
    itemId = item.id;
    await upsertAccounts(itemId, [
      {
        account_id: "acc1",
        name: "Checking",
        mask: "1234",
        type: "depository",
        subtype: "checking",
        balances: { current: 1000, available: 900, iso_currency_code: "USD" },
      } as any,
    ]);
  });

  it("maps Plaid PFC primary to the default category", async () => {
    await upsertTransactions([pending]);
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "p1"));
    const [food] = await db.select().from(schema.categories).where(eq(schema.categories.plaidPrimary, "FOOD_AND_DRINK"));
    expect(row.categoryId).toBe(food.id);
  });

  it("keeps a user edit on modified, but still applies non-owned field updates", async () => {
    let [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "p1"));
    const [ent] = await db.select().from(schema.categories).where(eq(schema.categories.plaidPrimary, "ENTERTAINMENT"));
    await db.update(schema.transactions)
      .set({ categoryId: ent.id, notes: "team coffee", userEdited: true })
      .where(eq(schema.transactions.id, row.id));

    // re-sync same pending tx (modified) must not clobber the edit
    await upsertTransactions([{ ...pending, amount: 13.0 }]);
    [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "p1"));
    expect(row.categoryId).toBe(ent.id);
    expect(row.notes).toBe("team coffee");
    expect(row.amount).toBe("13.00");
  });

  it("marks removed transactions as is_removed and inherits edits when posted replaces pending", async () => {
    const [ent] = await db.select().from(schema.categories).where(eq(schema.categories.plaidPrimary, "ENTERTAINMENT"));

    // posted replaces pending: removed p1, added t1 with pending_transaction_id
    await markRemoved([{ transaction_id: "p1" } as any]);
    await upsertTransactions([{ ...pending, transaction_id: "t1", pending: false, pending_transaction_id: "p1", amount: 13.0 }]);

    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t1"));
    const [old] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "p1"));

    expect(old.isRemoved).toBe(true);
    expect(row.categoryId).toBe(ent.id);
    expect(row.notes).toBe("team coffee");
    expect(row.userEdited).toBe(true);
  });

  it("cascades transaction deletes when the owning item is deleted", async () => {
    await db.delete(schema.items).where(eq(schema.items.id, itemId));
    const left = await db.select().from(schema.transactions);
    expect(left).toHaveLength(0);
  });
});
