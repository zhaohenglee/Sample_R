// Concurrency regression tests for a manual account's derived balance.
//
// recomputeManualBalance re-queries sum(amount) rather than incrementing a
// running total, which prevents arithmetic drift but NOT a stale read: under
// READ COMMITTED two concurrent writers would each read the sum before the
// other committed, and the loser would then store a stale total permanently.
// The account row is therefore locked FOR UPDATE before the sum is read.
//
// These tests fail if that lock is removed. They drive the real code paths
// (not recomputeManualBalance directly) so they also cover the lock ordering
// that keeps a concurrent create and edit from deadlocking.
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createManualAccount, createManualTransaction, deleteManualTransaction } from "@/lib/manual";
import { updateTransaction } from "@/lib/transactions";

const { accounts, transactions, items, balanceSnapshots } = schema;

async function balanceOf(accountId: number): Promise<string> {
  const [row] = await db.select({ b: accounts.currentBalance }).from(accounts).where(eq(accounts.id, accountId));
  return row!.b!;
}

// The balance the ledger implies, computed independently of the stored value.
async function ledgerBalance(accountId: number): Promise<string> {
  const [acct] = await db.select().from(accounts).where(eq(accounts.id, accountId));
  const rows = await db.select({ a: transactions.amount }).from(transactions)
    .where(eq(transactions.accountId, accountId));
  const sum = rows.reduce((s, r) => s + parseFloat(r.a), 0);
  return (parseFloat(acct!.startingBalance ?? "0") - sum).toFixed(2);
}

async function seedAccount(startingBalance: number) {
  return createManualAccount({
    name: "Cash Wallet", type: "other", subtype: null, startingBalance, currency: "USD",
  });
}

async function addTx(accountId: number, amount: number, direction: "in" | "out") {
  return createManualTransaction({
    accountId, date: "2026-09-01", description: "t", amount, direction, categoryId: null, notes: null,
  });
}

describe("manual balance under concurrency", () => {
  beforeEach(async () => {
    await db.delete(balanceSnapshots);
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(items);
  });

  it("stays exact when many transactions are created at once", async () => {
    const account = await seedAccount(0);
    await Promise.all(Array.from({ length: 10 }, () => addTx(account.id, 10, "out")));
    expect(await balanceOf(account.id)).toBe("-100.00");
    expect(await balanceOf(account.id)).toBe(await ledgerBalance(account.id));
  });

  // Without the FOR UPDATE on the account row this stores a stale non-zero
  // balance: each deleter reads the sum before its peers commit.
  it("returns to the starting balance when many transactions are deleted at once", async () => {
    const account = await seedAccount(0);
    const created = [];
    for (let i = 0; i < 10; i++) created.push(await addTx(account.id, 10, "out"));
    expect(await balanceOf(account.id)).toBe("-100.00");

    await Promise.all(created.map((t) => deleteManualTransaction(t.id)));

    expect(await balanceOf(account.id)).toBe("0.00");
    expect(await balanceOf(account.id)).toBe(await ledgerBalance(account.id));
  });

  // Same race through the PATCH path.
  it("stays exact when many amounts are edited at once", async () => {
    const account = await seedAccount(0);
    const created = [];
    for (let i = 0; i < 25; i++) created.push(await addTx(account.id, 10, "out"));

    await Promise.all(created.map((t) => updateTransaction(t.id, { amount: 1, direction: "out" })));

    expect(await balanceOf(account.id)).toBe("-25.00");
    expect(await balanceOf(account.id)).toBe(await ledgerBalance(account.id));
  });

  // A create and an edit acquire the account and category locks in opposite
  // orders unless the edit path takes the account first. If that ordering
  // regresses this deadlocks and Postgres aborts one side with 40P01.
  it("does not deadlock when creates and edits interleave", async () => {
    const account = await seedAccount(100);
    const seeded = [];
    for (let i = 0; i < 5; i++) seeded.push(await addTx(account.id, 5, "out"));

    await Promise.all([
      ...seeded.map((t) => updateTransaction(t.id, { amount: 2, direction: "out" })),
      ...Array.from({ length: 5 }, () => addTx(account.id, 3, "in")),
    ]);

    expect(await balanceOf(account.id)).toBe(await ledgerBalance(account.id));
    expect(await balanceOf(account.id)).toBe("105.00");
  });

  it("writes the corrected balance into today's snapshot too", async () => {
    const account = await seedAccount(0);
    const created = [];
    for (let i = 0; i < 6; i++) created.push(await addTx(account.id, 10, "out"));
    await Promise.all(created.map((t) => deleteManualTransaction(t.id)));

    const snaps = await db.select().from(balanceSnapshots).where(eq(balanceSnapshots.accountId, account.id));
    expect(snaps).toHaveLength(1);
    expect(snaps[0].current).toBe("0.00");
  });
});
