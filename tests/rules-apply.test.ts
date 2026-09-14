import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { upsertTransactions } from "@/lib/sync";
import { applyRulesToTransactions, createRule, deleteRule } from "@/lib/rules";
import { updateTransaction, bulkCategorize } from "@/lib/transactions";
import { createCategory } from "@/lib/categories";
import { encrypt } from "@/lib/crypto";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// T3.2: applying category rules on sync (new rows only) and on demand
// (applyRulesToTransactions / POST /api/rules/apply).
describe("applyRulesToTransactions", () => {
  let categoryId: number;
  let otherCategoryId: number;
  let accountId: number;

  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.categoryRules);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);

    const category = await createCategory({ name: "Coffee" });
    categoryId = category.id;
    const other = await createCategory({ name: "Other" });
    otherCategoryId = other.id;

    const [item] = await db
      .insert(schema.items)
      .values({ plaidItemId: "item-rules-apply", accessTokenEnc: encrypt("tok") })
      .returning();
    const [account] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-rules-apply", name: "Checking", type: "depository" })
      .returning();
    accountId = account.id;
  });

  function makeTx(overrides: Record<string, unknown> = {}) {
    return {
      transaction_id: "t1",
      account_id: "acc-rules-apply",
      date: "2026-09-01",
      amount: 10,
      name: "STARBUCKS",
      merchant_name: "Starbucks",
      pending: false,
      personal_finance_category: null,
      ...overrides,
    } as any;
  }

  it("(a) sync integration: new rows are categorized by matching rules, non-matches are untouched", async () => {
    await createRule({
      name: "Coffee rule",
      field: "merchant_name",
      match: "contains",
      pattern: "starbucks",
      categoryId,
      setDisplayName: "Coffee run",
    });
    const [rule] = await db.select().from(schema.categoryRules);

    await upsertTransactions([
      makeTx({ transaction_id: "t1", name: "STARBUCKS", merchant_name: "Starbucks" }),
      makeTx({ transaction_id: "t2", name: "GROCERY STORE", merchant_name: "Grocery Co" }),
    ]);

    const [t1] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t1"));
    const [t2] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t2"));

    expect(t1.categoryId).toBe(categoryId);
    expect(t1.displayName).toBe("Coffee run");
    expect(t1.ruleId).toBe(rule.id);
    expect(t1.userEdited).toBe(false);

    expect(t2.categoryId).toBeNull();
    expect(t2.displayName).toBeNull();
    expect(t2.ruleId).toBeNull();
  });

  it("(b) a modified sync of the same row does not re-run rules", async () => {
    // Give "Coffee" the Plaid PFC mapping the transaction itself carries, so
    // the base sync's own (rule-independent) category resolution lands on
    // the same category the rule does -- isolating what this test actually
    // checks: that a *second* upsert of the same plaid_transaction_id, after
    // the rule has been repointed elsewhere, does not forcibly re-apply the
    // now-changed rule to it.
    await db.update(schema.categories).set({ plaidPrimary: "FOOD_AND_DRINK" }).where(eq(schema.categories.id, categoryId));
    const pfc = { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE" };

    const rule = await createRule({
      name: "Coffee rule",
      field: "merchant_name",
      match: "contains",
      pattern: "starbucks",
      categoryId,
    });

    await upsertTransactions([makeTx({ transaction_id: "t1", personal_finance_category: pfc })]);
    let [t1] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t1"));
    expect(t1.categoryId).toBe(categoryId);
    expect(t1.ruleId).toBe(rule.id);

    // Change the rule to point elsewhere, then re-sync the same transaction
    // id (a "modified" row, not a new one). If rules were mistakenly re-run
    // here, category_id would flip to otherCategoryId.
    await db.update(schema.categoryRules).set({ categoryId: otherCategoryId }).where(eq(schema.categoryRules.id, rule.id));
    await upsertTransactions([makeTx({ transaction_id: "t1", amount: 11, personal_finance_category: pfc })]);

    [t1] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t1"));
    expect(t1.amount).toBe("11.00");
    expect(t1.categoryId).toBe(categoryId); // unchanged: rules never re-run on a modified row
    expect(t1.ruleId).toBe(rule.id);
  });

  it("a rule-assigned category survives a modified sync even when the incoming Plaid PFC maps elsewhere", async () => {
    const groceries = await createCategory({ name: "Groceries", plaidPrimary: "GROCERIES" });

    const rule = await createRule({
      name: "Coffee rule",
      field: "merchant_name",
      match: "contains",
      pattern: "starbucks",
      categoryId,
    });

    // New row, no PFC of its own: the rule is what categorizes it.
    await upsertTransactions([makeTx({ transaction_id: "t1", amount: 10 })]);
    let [t1] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t1"));
    expect(t1.categoryId).toBe(categoryId);
    expect(t1.ruleId).toBe(rule.id);

    // Modified re-sync of the same transaction: different amount, and this
    // time Plaid reports a PFC that maps to a different category entirely.
    // Since rule_id is set, the base sync must not fall back to that Plaid
    // mapping -- the rule's category (and rule_id) must survive.
    await upsertTransactions([
      makeTx({
        transaction_id: "t1",
        amount: 12.34,
        personal_finance_category: { primary: "GROCERIES", detailed: "GROCERIES_SUPERMARKET" },
      }),
    ]);

    [t1] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "t1"));
    expect(t1.amount).toBe("12.34");
    expect(t1.categoryId).toBe(categoryId);
    expect(t1.categoryId).not.toBe(groceries.id);
    expect(t1.ruleId).toBe(rule.id);
  });

  it("(c) user_edited rows are skipped unless includeEdited is set", async () => {
    await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-edited",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
        categoryId: otherCategoryId,
        userEdited: true,
      })
      .returning();

    let result = await applyRulesToTransactions([tx.id], {});
    expect(result).toEqual({ matched: 0, changed: 0 });
    let [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBe(otherCategoryId);
    expect(row.ruleId).toBeNull();

    result = await applyRulesToTransactions([tx.id], { includeEdited: true });
    expect(result).toEqual({ matched: 1, changed: 1 });
    [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBe(categoryId);
    // Applying a rule is not a user edit.
    expect(row.userEdited).toBe(true);
  });

  it("(d) dryRun returns counts but writes nothing", async () => {
    await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-dry",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    const result = await applyRulesToTransactions([tx.id], { dryRun: true });
    expect(result).toEqual({ matched: 1, changed: 1 });

    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBeNull();
    expect(row.ruleId).toBeNull();
    expect(row.displayName).toBeNull();
  });

  it("(e) priority: the lower priority number wins between two overlapping rules", async () => {
    await createRule({
      name: "Specific, low priority number",
      field: "merchant_name",
      match: "contains",
      pattern: "starbucks",
      categoryId,
      priority: 5,
    });
    await createRule({
      name: "Broad, high priority number",
      field: "merchant_name",
      match: "contains",
      pattern: "star",
      categoryId: otherCategoryId,
      priority: 50,
    });

    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-priority",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    const result = await applyRulesToTransactions([tx.id], {});
    expect(result).toEqual({ matched: 1, changed: 1 });
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBe(categoryId);
  });

  it("(f) a disabled rule never applies, even when targeted directly by ruleId", async () => {
    const rule = await createRule({
      name: "Disabled",
      field: "merchant_name",
      match: "contains",
      pattern: "starbucks",
      categoryId,
      enabled: false,
    });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-disabled",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    let result = await applyRulesToTransactions([tx.id], {});
    expect(result).toEqual({ matched: 0, changed: 0 });

    result = await applyRulesToTransactions([tx.id], { ruleId: rule.id });
    expect(result).toEqual({ matched: 0, changed: 0 });

    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBeNull();
    expect(row.ruleId).toBeNull();
  });

  it("(g) a rule with set_display_name null leaves an existing display_name intact", async () => {
    await createRule({ name: "No display name", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-displayname",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
        displayName: "My Coffee",
      })
      .returning();

    const result = await applyRulesToTransactions([tx.id], {});
    expect(result).toEqual({ matched: 1, changed: 1 }); // category_id still changes
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.displayName).toBe("My Coffee");
    expect(row.categoryId).toBe(categoryId);
  });

  it("(h) deleting a rule sets transactions.rule_id to null", async () => {
    const rule = await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-delete",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    await applyRulesToTransactions([tx.id], {});
    let [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.ruleId).toBe(rule.id);

    await deleteRule(rule.id);
    [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.ruleId).toBeNull();
    // The rule's own category assignment is untouched by the FK cascade.
    expect(row.categoryId).toBe(categoryId);
  });

  it("removed transactions are skipped", async () => {
    await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-removed",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
        isRemoved: true,
      })
      .returning();

    const result = await applyRulesToTransactions([tx.id], {});
    expect(result).toEqual({ matched: 0, changed: 0 });
    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBeNull();
  });

  it("a concurrent user edit that lands between an earlier read and the write is not clobbered", async () => {
    // Regression test for the read-outside-the-write-transaction bug: the
    // batch select and the batch write must happen inside the same
    // db.transaction, locking the rows with FOR UPDATE, so a concurrent
    // user_edited=true landing in between is picked up fresh instead of
    // being blindly overwritten once the write's UPDATE finally gets the
    // row lock.
    //
    // This is exercised with two real, concurrently-running Postgres
    // transactions rather than a spy: a "manual" transaction takes the row
    // lock first (SELECT ... FOR UPDATE), marks the row user_edited, holds
    // the lock open for a short delay, then commits. applyRulesToTransactions
    // is started while that lock is still held, so its own FOR UPDATE select
    // must block until the manual transaction commits -- at which point it
    // sees the row as already user_edited and skips it. Before the fix, the
    // unlocked read would have raced ahead, seen the pre-edit row, and its
    // later blind UPDATE would have overwritten the user's edit once the
    // manual transaction's lock finally released.
    await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-race",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    const manualTxPromise = db.transaction(async (manualTx) => {
      await manualTx.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id)).for("update");
      await manualTx
        .update(schema.transactions)
        .set({ userEdited: true, categoryId: otherCategoryId })
        .where(eq(schema.transactions.id, tx.id));
      // Hold the row lock open well past when applyRulesToTransactions
      // starts (and blocks on it), so the ordering above is guaranteed
      // rather than a race between two independent timers.
      await sleep(150);
    });

    // Give the manual transaction a head start so it is the one to acquire
    // the lock first.
    await sleep(30);

    const applyPromise = applyRulesToTransactions([tx.id], {});

    const [result] = await Promise.all([applyPromise, manualTxPromise]);

    // The row was already user_edited by the time apply's locked read ran,
    // so it was skipped entirely -- not matched, and certainly not written.
    expect(result).toEqual({ matched: 0, changed: 0 });

    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.userEdited).toBe(true);
    expect(row.categoryId).toBe(otherCategoryId);
    expect(row.ruleId).toBeNull();
  });

  it("a manual category patch clears rule_id (the 'set by rule' badge no longer applies)", async () => {
    const rule = await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-manual-edit",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    await applyRulesToTransactions([tx.id], {});
    let [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBe(categoryId);
    expect(row.ruleId).toBe(rule.id);

    await updateTransaction(tx.id, { categoryId: otherCategoryId });
    [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBe(otherCategoryId);
    expect(row.ruleId).toBeNull();
  });

  it("bulkCategorize also clears rule_id on the rows it re-categorizes", async () => {
    const rule = await createRule({ name: "Coffee rule", field: "merchant_name", match: "contains", pattern: "starbucks", categoryId });
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId,
        plaidTransactionId: "t-bulk-edit",
        date: "2026-09-01",
        amount: "5.00",
        name: "STARBUCKS",
        merchantName: "Starbucks",
      })
      .returning();

    await applyRulesToTransactions([tx.id], {});
    let [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.ruleId).toBe(rule.id);

    await bulkCategorize({ ids: [tx.id], categoryId: otherCategoryId });
    [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBe(otherCategoryId);
    expect(row.ruleId).toBeNull();
  });
});
