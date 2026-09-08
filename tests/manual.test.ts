import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "@/lib/categories";
import {
  validateManualAccountInput,
  validateManualTransactionInput,
  createManualAccount,
  deleteManualAccount,
  createManualTransaction,
  deleteManualTransaction,
  recomputeManualBalance,
} from "@/lib/manual";
import { syncItem } from "@/lib/sync";

describe("manual account validation", () => {
  it("rejects an unknown field", () => {
    expect(() => validateManualAccountInput({ name: "Cash", type: "other", startingBalance: 0, nope: 1 })).toThrow(
      ValidationError,
    );
  });

  it("requires a name between 1 and 60 characters", () => {
    expect(() => validateManualAccountInput({ name: "", type: "other", startingBalance: 0 })).toThrow(ValidationError);
    expect(() => validateManualAccountInput({ name: "x".repeat(61), type: "other", startingBalance: 0 })).toThrow(
      ValidationError,
    );
    expect(validateManualAccountInput({ name: "  Cash  ", type: "other", startingBalance: 0 }).name).toBe("Cash");
  });

  it("rejects an unknown account type", () => {
    expect(() => validateManualAccountInput({ name: "Cash", type: "bogus", startingBalance: 0 })).toThrow(
      ValidationError,
    );
  });

  it("accepts every documented account type", () => {
    for (const type of ["depository", "credit", "loan", "investment", "other"]) {
      expect(validateManualAccountInput({ name: "Cash", type, startingBalance: 0 }).type).toBe(type);
    }
  });

  it("rejects a startingBalance with more than 2 decimal places", () => {
    expect(() => validateManualAccountInput({ name: "Cash", type: "other", startingBalance: 1.005 })).toThrow(
      ValidationError,
    );
    expect(validateManualAccountInput({ name: "Cash", type: "other", startingBalance: 1.01 }).startingBalance).toBe(
      1.01,
    );
  });

  it("rejects a non-finite startingBalance", () => {
    expect(() => validateManualAccountInput({ name: "Cash", type: "other", startingBalance: NaN })).toThrow(
      ValidationError,
    );
    expect(() => validateManualAccountInput({ name: "Cash", type: "other", startingBalance: "5" })).toThrow(
      ValidationError,
    );
  });

  it("defaults currency to USD and uppercases a given code", () => {
    expect(validateManualAccountInput({ name: "Cash", type: "other", startingBalance: 0 }).currency).toBe("USD");
    expect(validateManualAccountInput({ name: "Cash", type: "other", startingBalance: 0, currency: "eur" }).currency).toBe(
      "EUR",
    );
  });

  it("rejects a malformed currency code", () => {
    expect(() =>
      validateManualAccountInput({ name: "Cash", type: "other", startingBalance: 0, currency: "US" }),
    ).toThrow(ValidationError);
  });

  it("trims subtype and normalizes blank to null", () => {
    expect(
      validateManualAccountInput({ name: "Cash", type: "depository", startingBalance: 0, subtype: "  savings  " })
        .subtype,
    ).toBe("savings");
    expect(
      validateManualAccountInput({ name: "Cash", type: "depository", startingBalance: 0, subtype: "   " }).subtype,
    ).toBeNull();
  });
});

describe("manual transaction validation", () => {
  const base = { accountId: 1, date: "2026-09-01", description: "Coffee", amount: 5, direction: "out" as const };

  it("rejects an unknown field", () => {
    expect(() => validateManualTransactionInput({ ...base, nope: 1 })).toThrow(ValidationError);
  });

  it("rejects a non-positive-integer accountId", () => {
    expect(() => validateManualTransactionInput({ ...base, accountId: 0 })).toThrow(ValidationError);
    expect(() => validateManualTransactionInput({ ...base, accountId: "1" })).toThrow(ValidationError);
  });

  it("rejects an invalid calendar date", () => {
    expect(() => validateManualTransactionInput({ ...base, date: "2026-02-30" })).toThrow(ValidationError);
    expect(() => validateManualTransactionInput({ ...base, date: "09/01/2026" })).toThrow(ValidationError);
    expect(() => validateManualTransactionInput({ ...base, date: "not-a-date" })).toThrow(ValidationError);
  });

  it("accepts a valid leap-day date", () => {
    expect(validateManualTransactionInput({ ...base, date: "2024-02-29" }).date).toBe("2024-02-29");
  });

  it("requires a non-empty description within the length cap", () => {
    expect(() => validateManualTransactionInput({ ...base, description: "" })).toThrow(ValidationError);
    expect(() => validateManualTransactionInput({ ...base, description: "x".repeat(201) })).toThrow(ValidationError);
  });

  it("rejects a zero or negative amount", () => {
    expect(() => validateManualTransactionInput({ ...base, amount: 0 })).toThrow(ValidationError);
    expect(() => validateManualTransactionInput({ ...base, amount: -5 })).toThrow(ValidationError);
  });

  it("rejects an amount with more than 2 decimal places", () => {
    expect(() => validateManualTransactionInput({ ...base, amount: 5.005 })).toThrow(ValidationError);
  });

  it("rejects an invalid direction", () => {
    expect(() => validateManualTransactionInput({ ...base, direction: "sideways" })).toThrow(ValidationError);
  });

  it("accepts both directions", () => {
    expect(validateManualTransactionInput({ ...base, direction: "out" }).direction).toBe("out");
    expect(validateManualTransactionInput({ ...base, direction: "in" }).direction).toBe("in");
  });

  it("normalizes optional categoryId and notes", () => {
    const out = validateManualTransactionInput({ ...base, categoryId: null, notes: "   " });
    expect(out.categoryId).toBeNull();
    expect(out.notes).toBeNull();
  });

  it("rejects a non-positive-integer categoryId", () => {
    expect(() => validateManualTransactionInput({ ...base, categoryId: 0 })).toThrow(ValidationError);
  });
});

describe("manual account and transaction DB operations", () => {
  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
  });

  it("createManualAccount creates a dedicated item shell (null plaid fields) and an account with source='manual'", async () => {
    const account = await createManualAccount({
      name: "Cash wallet",
      type: "other",
      subtype: null,
      startingBalance: 42.5,
      currency: "USD",
    });
    expect(account.source).toBe("manual");
    expect(account.plaidAccountId).toBeNull();
    expect(account.currentBalance).toBe("42.50");
    expect(account.availableBalance).toBe("42.50");

    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, account.itemId));
    expect(item.plaidItemId).toBeNull();
    expect(item.accessTokenEnc).toBeNull();
  });

  it("deleteManualAccount cascades its transactions and leaves Plaid data intact", async () => {
    const [plaidItem] = await db
      .insert(schema.items)
      .values({ plaidItemId: "plaid-item-1", accessTokenEnc: "unused", institutionName: "Real Bank" })
      .returning();
    const [plaidAccount] = await db
      .insert(schema.accounts)
      .values({ itemId: plaidItem.id, plaidAccountId: "plaid-acc-1", name: "Checking", type: "depository" })
      .returning();
    const [plaidTx] = await db
      .insert(schema.transactions)
      .values({ accountId: plaidAccount.id, plaidTransactionId: "plaid-tx-1", date: "2026-09-01", amount: "10.00", name: "Store" })
      .returning();

    const manualAccount = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 0,
      currency: "USD",
    });
    const manualTx = await createManualTransaction({
      accountId: manualAccount.id,
      date: "2026-09-01",
      description: "Yard sale",
      amount: 20,
      direction: "in",
      categoryId: null,
      notes: null,
    });

    const deleted = await deleteManualAccount(manualAccount.id);
    expect(deleted?.id).toBe(manualAccount.id);

    const [account] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, manualAccount.id));
    expect(account).toBeUndefined();
    const [tx] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, manualTx.id));
    expect(tx).toBeUndefined();
    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, manualAccount.itemId));
    expect(item).toBeUndefined();

    // Plaid data is untouched.
    const [stillPlaidItem] = await db.select().from(schema.items).where(eq(schema.items.id, plaidItem.id));
    expect(stillPlaidItem).toBeDefined();
    const [stillPlaidAccount] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, plaidAccount.id));
    expect(stillPlaidAccount).toBeDefined();
    const [stillPlaidTx] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, plaidTx.id));
    expect(stillPlaidTx).toBeDefined();
  });

  it("deleteManualAccount returns null for a missing id and throws ValidationError for a Plaid account", async () => {
    expect(await deleteManualAccount(999999)).toBeNull();

    const [plaidItem] = await db
      .insert(schema.items)
      .values({ plaidItemId: "plaid-item-2", accessTokenEnc: "unused" })
      .returning();
    const [plaidAccount] = await db
      .insert(schema.accounts)
      .values({ itemId: plaidItem.id, plaidAccountId: "plaid-acc-2", name: "Savings", type: "depository" })
      .returning();
    await expect(deleteManualAccount(plaidAccount.id)).rejects.toBeInstanceOf(ValidationError);
  });

  it("createManualTransaction follows Plaid's sign convention: 'out' is positive, 'in' is negative", async () => {
    const account = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 0,
      currency: "USD",
    });

    const spend = await createManualTransaction({
      accountId: account.id,
      date: "2026-09-01",
      description: "Groceries",
      amount: 33.5,
      direction: "out",
      categoryId: null,
      notes: null,
    });
    expect(spend.amount).toBe("33.50");
    expect(spend.source).toBe("manual");
    expect(spend.plaidTransactionId).toMatch(/^manual:/);

    const income = await createManualTransaction({
      accountId: account.id,
      date: "2026-09-02",
      description: "Freelance payment",
      amount: 100,
      direction: "in",
      categoryId: null,
      notes: null,
    });
    expect(income.amount).toBe("-100.00");
  });

  it("createManualTransaction rejects a non-manual account", async () => {
    const [plaidItem] = await db
      .insert(schema.items)
      .values({ plaidItemId: "plaid-item-3", accessTokenEnc: "unused" })
      .returning();
    const [plaidAccount] = await db
      .insert(schema.accounts)
      .values({ itemId: plaidItem.id, plaidAccountId: "plaid-acc-3", name: "Checking", type: "depository" })
      .returning();

    await expect(
      createManualTransaction({
        accountId: plaidAccount.id,
        date: "2026-09-01",
        description: "Nope",
        amount: 5,
        direction: "out",
        categoryId: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("deleteManualTransaction deletes a manual row but rejects a Plaid row", async () => {
    const account = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 0,
      currency: "USD",
    });
    const tx = await createManualTransaction({
      accountId: account.id,
      date: "2026-09-01",
      description: "Tip jar",
      amount: 5,
      direction: "in",
      categoryId: null,
      notes: null,
    });
    const deleted = await deleteManualTransaction(tx.id);
    expect(deleted?.id).toBe(tx.id);
    const [gone] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(gone).toBeUndefined();

    const [plaidItem] = await db
      .insert(schema.items)
      .values({ plaidItemId: "plaid-item-4", accessTokenEnc: "unused" })
      .returning();
    const [plaidAccount] = await db
      .insert(schema.accounts)
      .values({ itemId: plaidItem.id, plaidAccountId: "plaid-acc-4", name: "Checking", type: "depository" })
      .returning();
    const [plaidTx] = await db
      .insert(schema.transactions)
      .values({ accountId: plaidAccount.id, plaidTransactionId: "plaid-tx-4", date: "2026-09-01", amount: "10.00", name: "Store" })
      .returning();
    await expect(deleteManualTransaction(plaidTx.id)).rejects.toBeInstanceOf(ValidationError);
    const [stillThere] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, plaidTx.id));
    expect(stillThere).toBeDefined();
  });

  it("deleteManualTransaction returns null for a missing id", async () => {
    expect(await deleteManualTransaction(999999)).toBeNull();
  });
});

describe("manual balance recomputation", () => {
  beforeEach(async () => {
    await db.delete(schema.balanceSnapshots);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
  });

  it("createManualAccount sets current/available balance from starting_balance and writes today's snapshot", async () => {
    const account = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 250,
      currency: "USD",
    });
    expect(account.startingBalance).toBe("250.00");
    expect(account.currentBalance).toBe("250.00");
    expect(account.availableBalance).toBe("250.00");

    const [snapshot] = await db.select().from(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.accountId, account.id));
    expect(snapshot.current).toBe("250.00");
  });

  it("recomputes current_balance as starting_balance minus the net of amount over non-removed transactions", async () => {
    const account = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 250,
      currency: "USD",
    });

    await createManualTransaction({
      accountId: account.id,
      date: "2026-09-01",
      description: "Groceries",
      amount: 40,
      direction: "out",
      categoryId: null,
      notes: null,
    });
    let [after] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, account.id));
    expect(after.currentBalance).toBe("210.00");

    const income = await createManualTransaction({
      accountId: account.id,
      date: "2026-09-02",
      description: "Refund",
      amount: 15,
      direction: "in",
      categoryId: null,
      notes: null,
    });
    [after] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, account.id));
    expect(after.currentBalance).toBe("225.00"); // 250 - 40 + 15

    await deleteManualTransaction(income.id);
    [after] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, account.id));
    expect(after.currentBalance).toBe("210.00"); // back to starting - 40

    const [snapshot] = await db.select().from(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.accountId, account.id));
    expect(snapshot.current).toBe("210.00");
  });

  it("recompute always re-queries the sum rather than incrementing: a direct edit of a transaction's amount is picked up", async () => {
    const account = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 100,
      currency: "USD",
    });
    const tx = await createManualTransaction({
      accountId: account.id,
      date: "2026-09-01",
      description: "Coffee",
      amount: 5,
      direction: "out",
      categoryId: null,
      notes: null,
    });
    let [after] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, account.id));
    expect(after.currentBalance).toBe("95.00");

    // Bypass the app's own edit path entirely -- proves the recompute reads
    // the ledger fresh rather than trusting a cached delta -- then trigger a
    // recompute the same way updateTransaction does.
    await db.update(schema.transactions).set({ amount: "20.00" }).where(eq(schema.transactions.id, tx.id));
    await recomputeManualBalance(db, account.id);

    [after] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, account.id));
    expect(after.currentBalance).toBe("80.00");
  });

  it("is a no-op for a Plaid account", async () => {
    const [plaidItem] = await db
      .insert(schema.items)
      .values({ plaidItemId: "plaid-item-bal", accessTokenEnc: "unused" })
      .returning();
    const [plaidAccount] = await db
      .insert(schema.accounts)
      .values({ itemId: plaidItem.id, plaidAccountId: "plaid-acc-bal", name: "Checking", type: "depository", currentBalance: "42.00" })
      .returning();

    await recomputeManualBalance(db, plaidAccount.id);

    const [after] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, plaidAccount.id));
    expect(after.currentBalance).toBe("42.00"); // untouched
    const snapshots = await db.select().from(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.accountId, plaidAccount.id));
    expect(snapshots).toHaveLength(0); // no snapshot written either
  });
});

describe("sync skips manual items and never touches non-Plaid rows", () => {
  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
  });

  it("syncItem is a no-op for a manual item (null access token), without throwing", async () => {
    const account = await createManualAccount({
      name: "Cash",
      type: "other",
      subtype: null,
      startingBalance: 10,
      currency: "USD",
    });
    const result = await syncItem(account.itemId);
    expect(result).toEqual({ itemId: account.itemId, added: 0, modified: 0, removed: 0 });

    // No sync_log row was written for a skipped item.
    const logs = await db.select().from(schema.syncLog).where(eq(schema.syncLog.itemId, account.itemId));
    expect(logs).toHaveLength(0);
  });

  // A prior version of this test called syncAllItems() here with no Plaid
  // item in the database at all -- the loop body (and every source filter
  // inside it) never ran, so the assertions proved nothing. The real
  // multi-filter isolation coverage (a genuine sync pass, with a Plaid item
  // and account coexisting alongside manual data) now lives in
  // tests/sync-isolation.test.ts; this file keeps only the syncItem no-op
  // unit test above, which is independently meaningful on its own.
});
