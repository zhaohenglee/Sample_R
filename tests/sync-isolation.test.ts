import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { ensureDefaultCategories } from "@/lib/categories";
import { createManualAccount, createManualTransaction } from "@/lib/manual";
import { upsertAccounts, upsertTransactions, markRemoved, writeBalanceSnapshots } from "@/lib/sync";

// Drives a genuine sync pass -- a real Plaid item and account seeded the way
// tests/sync.test.ts does, with a manual account and manual transactions
// coexisting in the same database -- and proves each `eq(*.source, "plaid")`
// guard in src/lib/sync.ts is load-bearing: remove any one of them and one
// of these tests goes red. This replaces an earlier version of this test
// that called syncAllItems() with no Plaid item in the database at all, so
// the guarded code never ran and the assertions proved nothing.
//
// See the per-test comments for exactly which line each test catches, and
// the comment on the newRows test for the one guard (existingRows' source
// filter) that turned out NOT to be independently observable -- explained
// there rather than glossed over with a redundant test.
describe("sync isolation: a genuine sync pass never reads or writes non-Plaid rows", () => {
  let plaidItemDbId: number;
  let plaidAccountDbId: number;
  let manualAccountId: number;
  let manualTx: typeof schema.transactions.$inferSelect;

  beforeEach(async () => {
    await db.delete(schema.balanceSnapshots);
    await db.delete(schema.transactions);
    await db.delete(schema.categoryRules);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await ensureDefaultCategories();

    const [plaidItem] = await db
      .insert(schema.items)
      .values({ plaidItemId: "iso-item-1", accessTokenEnc: encrypt("tok-iso") })
      .returning();
    plaidItemDbId = plaidItem.id;
    await upsertAccounts(plaidItemDbId, [
      {
        account_id: "iso-acc-1",
        name: "Checking",
        mask: "0001",
        type: "depository",
        subtype: "checking",
        balances: { current: 500, available: 500, iso_currency_code: "USD" },
      } as any,
    ]);
    const [plaidAccount] = await db.select().from(schema.accounts).where(eq(schema.accounts.plaidAccountId, "iso-acc-1"));
    plaidAccountDbId = plaidAccount.id;

    const manualAccount = await createManualAccount({
      name: "Cash wallet",
      type: "other",
      subtype: null,
      startingBalance: 100,
      currency: "USD",
    });
    manualAccountId = manualAccount.id;
    manualTx = await createManualTransaction({
      accountId: manualAccountId,
      date: "2026-09-01",
      description: "Yard sale proceeds",
      amount: 25,
      direction: "in",
      categoryId: null,
      notes: "keepsake",
    });
  });

  it("a normal sync pass (no crafted collisions) leaves the manual account and transaction byte-identical", async () => {
    const [accountBefore] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, manualAccountId));
    const [txBefore] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, manualTx.id));

    await upsertTransactions([
      {
        transaction_id: "iso-tx-1",
        account_id: "iso-acc-1",
        date: "2026-09-02",
        amount: 12.5,
        name: "Coffee shop",
        pending: false,
        personal_finance_category: { primary: "FOOD_AND_DRINK", detailed: "FOOD_AND_DRINK_COFFEE" },
      } as any,
    ]);
    await markRemoved([{ transaction_id: "does-not-exist" } as any]);
    await writeBalanceSnapshots(plaidItemDbId);

    const [accountAfter] = await db.select().from(schema.accounts).where(eq(schema.accounts.id, manualAccountId));
    const [txAfter] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, manualTx.id));
    expect(accountAfter).toEqual(accountBefore);
    expect(txAfter).toEqual(txBefore);
  });

  // Catches removal of the `eq(accounts.source, "plaid")` filter on the
  // accountRows query in upsertTransactions (src/lib/sync.ts, the query
  // feeding `accountMap`). A manual account's plaid_account_id is always
  // null through the app's own code, so this collision can't happen for
  // real -- it's forced here with a direct update to prove the guard would
  // still hold even if it somehow did.
  it("catches removal of the account-map source filter: a transaction can never resolve to a manual account", async () => {
    await db.update(schema.accounts).set({ plaidAccountId: "collide-acct" }).where(eq(schema.accounts.id, manualAccountId));

    await upsertTransactions([
      {
        transaction_id: "iso-tx-collide-acct",
        account_id: "collide-acct",
        date: "2026-09-02",
        amount: 9.99,
        name: "Should never land on the manual account",
        pending: false,
      } as any,
    ]);

    // With the filter present, accountMap never resolves "collide-acct" (the
    // manual account is excluded from the map), so the transaction has no
    // known account and is skipped entirely -- it is never written at all.
    const landed = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "iso-tx-collide-acct"));
    expect(landed).toHaveLength(0);
  });

  // Catches removal of the `eq(transactions.source, "plaid")` filter in
  // markRemoved (src/lib/sync.ts). No crafted collision needed -- markRemoved
  // just takes a list of ids to mark removed, so this passes the manual
  // transaction's own real id directly.
  it("catches removal of the markRemoved source filter: a manual transaction is never marked removed", async () => {
    await markRemoved([{ transaction_id: manualTx.plaidTransactionId } as any]);
    const [after] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, manualTx.id));
    expect(after.isRemoved).toBe(false);
  });

  // Catches removal of the `eq(transactions.source, "plaid")` filter on the
  // pending-inheritance lookup in upsertTransactions (src/lib/sync.ts, the
  // query keyed on `t.pending_transaction_id`). The manual row is given
  // user-edited category/notes/displayName, then a brand new (non-colliding)
  // posted transaction claims the manual row's id as *its*
  // pending_transaction_id -- a value Plaid itself would never send, but
  // exactly what this lookup keys on.
  it("catches removal of the pending-inheritance source filter: a new row never inherits a manual row's edits", async () => {
    const [foodCategory] = await db.select().from(schema.categories).where(eq(schema.categories.plaidPrimary, "FOOD_AND_DRINK"));
    await db.update(schema.transactions)
      .set({ categoryId: foodCategory.id, notes: "manual note", displayName: "Manual display", userEdited: true })
      .where(eq(schema.transactions.id, manualTx.id));

    await upsertTransactions([
      {
        transaction_id: "iso-tx-posted-1",
        account_id: "iso-acc-1",
        date: "2026-09-02",
        amount: 40,
        name: "Posted transaction",
        pending: false,
        pending_transaction_id: manualTx.plaidTransactionId,
      } as any,
    ]);

    const [posted] = await db.select().from(schema.transactions).where(eq(schema.transactions.plaidTransactionId, "iso-tx-posted-1"));
    expect(posted.notes).not.toBe("manual note");
    expect(posted.displayName).not.toBe("Manual display");
    expect(posted.userEdited).toBe(false);
  });

  // Catches removal of the `eq(transactions.source, "plaid")` filter on the
  // newRows query in upsertTransactions (src/lib/sync.ts, feeding
  // applyRulesToTransactions). A rule that would match the manual
  // transaction's name is seeded; a second transaction, addressed to an
  // account that does not exist, is upserted carrying the manual row's own
  // id as its transaction_id -- its account is never found, so the main
  // write loop skips it entirely (no write to any row happens from this
  // call), but its id still reaches `plaidIds`, so both existingRows and
  // newRows are asked about it.
  //
  // This is also the only reachable scenario for existingRows' own source
  // filter (the one feeding `existedBefore` -> `newPlaidIds`), and tracing
  // it shows that filter is not independently observable: removing it makes
  // `existedBefore` incorrectly treat the manual row as "already existing",
  // which *excludes* its id from newPlaidIds -- so the newRows filter below
  // is never even asked about it, and no corruption occurs either way.
  // Removing existingRows' filter alone therefore leaves this test green;
  // only removing the newRows filter below (with or without existingRows')
  // turns it red. It is kept for what it correctly means (rows genuinely
  // new relative to Plaid, not manual/csv) and as a second line of defense
  // if the newRows query ever changes, not because this test can prove it
  // independently load-bearing today -- flagged here rather than claimed.
  it("catches removal of the newRows source filter: category rules are never applied to a manual transaction", async () => {
    const [entertainment] = await db.select().from(schema.categories).where(eq(schema.categories.plaidPrimary, "ENTERTAINMENT"));
    await db.insert(schema.categoryRules).values({
      name: "yard sale rule",
      field: "name",
      match: "contains",
      pattern: "yard sale",
      categoryId: entertainment.id,
      priority: 1,
      enabled: true,
    });

    await upsertTransactions([
      {
        transaction_id: manualTx.plaidTransactionId,
        account_id: "no-such-account",
        date: "2026-09-02",
        amount: 5,
        name: "irrelevant -- this transaction is never written",
        pending: false,
      } as any,
    ]);

    const [after] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, manualTx.id));
    expect(after.categoryId).toBeNull();
    expect(after.ruleId).toBeNull();
  });

  it("writeBalanceSnapshots only ever touches its own item's account, never the manual account's snapshot", async () => {
    // Per decision (docs/TASKS.md Phase 6): writeBalanceSnapshots no longer
    // filters by source at all -- a snapshot is a fact about an account, not
    // about Plaid. It still can't reach the manual account from a Plaid
    // item's sync pass: a manual account always belongs to its own
    // dedicated item (see src/lib/manual.ts createManualAccount), never a
    // Plaid item's id, so itemId scoping alone keeps this correct. The
    // manual account already has its own snapshot at this point, written by
    // recomputeManualBalance during setup (account creation, then the
    // transaction) -- this asserts that row is untouched by a Plaid sync
    // pass rather than merely absent.
    const [manualSnapshotBefore] = await db.select().from(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.accountId, manualAccountId));
    expect(manualSnapshotBefore).toBeDefined();

    await writeBalanceSnapshots(plaidItemDbId);

    const [manualSnapshotAfter] = await db.select().from(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.accountId, manualAccountId));
    expect(manualSnapshotAfter).toEqual(manualSnapshotBefore);
    const plaidSnapshots = await db.select().from(schema.balanceSnapshots).where(eq(schema.balanceSnapshots.accountId, plaidAccountDbId));
    expect(plaidSnapshots).toHaveLength(1);
  });
});
