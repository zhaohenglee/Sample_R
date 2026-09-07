import { describe, it, expect, beforeEach } from "vitest";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { monthFlow, recentTransactions, spendByCategory } from "@/lib/reports";

const MONTH_ISO = "2026-09-01";

describe("dashboard report queries respect hidden accounts", () => {
  let visibleAccountId: number;
  let hiddenAccountId: number;
  let categoryId: number;

  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);

    const [category] = await db.insert(schema.categories).values({ name: "Shopping" }).returning();
    categoryId = category.id;
    const [nextMonthCategory] = await db.insert(schema.categories).values({ name: "Next Month Only" }).returning();
    const [incomeCategory] = await db
      .insert(schema.categories)
      .values({ name: "Paycheck", plaidPrimary: "INCOME" })
      .returning();
    const [netNegativeCategory] = await db.insert(schema.categories).values({ name: "All Refunded" }).returning();

    const [item] = await db
      .insert(schema.items)
      .values({ plaidItemId: "item-report-test", accessTokenEnc: encrypt("tok") })
      .returning();

    const [visible] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-report-visible", name: "Visible Checking", type: "depository", hidden: false })
      .returning();
    visibleAccountId = visible.id;

    const [hidden] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-report-hidden", name: "Hidden Checking", type: "depository", hidden: true })
      .returning();
    hiddenAccountId = hidden.id;

    await db.insert(schema.transactions).values([
      {
        accountId: visibleAccountId,
        plaidTransactionId: "tx-report-visible-1",
        date: "2026-09-05",
        amount: "20.00",
        name: "Visible Store",
        categoryId,
      },
      {
        accountId: hiddenAccountId,
        plaidTransactionId: "tx-report-hidden-1",
        date: "2026-09-06",
        amount: "500.00",
        name: "Hidden Store",
        categoryId,
      },
      // Pins the month upper bound: dated in October, must not leak into
      // a September report.
      {
        accountId: visibleAccountId,
        plaidTransactionId: "tx-report-next-month",
        date: "2026-10-01",
        amount: "40.00",
        name: "October Purchase",
        categoryId: nextMonthCategory.id,
      },
      // Pins the income-like carve-out: a positive (outflow-shaped) amount
      // so only the plaidPrimary check, not the net > 0 having clause,
      // could be excluding it.
      {
        accountId: visibleAccountId,
        plaidTransactionId: "tx-report-income",
        date: "2026-09-10",
        amount: "50.00",
        name: "Side Income",
        categoryId: incomeCategory.id,
      },
      // Pins the having clause: a category whose only transaction is a
      // refund, so its net for the month is negative.
      {
        accountId: visibleAccountId,
        plaidTransactionId: "tx-report-net-negative",
        date: "2026-09-11",
        amount: "-10.00",
        name: "Refund",
        categoryId: netNegativeCategory.id,
      },
    ]);
  });

  it("spendByCategory excludes hidden-account spend", async () => {
    const rows = await spendByCategory(MONTH_ISO);
    const shopping = rows.find((r) => r.name === "Shopping");
    expect(shopping).toBeDefined();
    expect(parseFloat(shopping!.total)).toBe(20);
  });

  it("spendByCategory excludes next-month transactions, income-like categories, and net <= 0 categories", async () => {
    const rows = await spendByCategory(MONTH_ISO);
    expect(rows.some((r) => r.name === "Next Month Only")).toBe(false);
    expect(rows.some((r) => r.name === "Paycheck")).toBe(false);
    expect(rows.some((r) => r.name === "All Refunded")).toBe(false);
    // Shopping (this month, visible account, net positive) is unaffected.
    expect(rows.some((r) => r.name === "Shopping")).toBe(true);
  });

  it("monthFlow excludes hidden-account amounts", async () => {
    // Gross, not per-category: includes Shopping (20) and the Side Income
    // fixture transaction (50, positive/outflow-shaped) but not the hidden
    // 500, the October transaction, or the -10 refund (that's inflow).
    const flow = await monthFlow(MONTH_ISO);
    expect(parseFloat(flow.out)).toBe(70);
    expect(parseFloat(flow.inflow)).toBe(10);
  });

  it("recentTransactions excludes hidden-account rows", async () => {
    const rows = await recentTransactions(10);
    expect(rows.some((r) => r.name === "Hidden Store")).toBe(false);
    expect(rows.some((r) => r.name === "Visible Store")).toBe(true);
  });
});
