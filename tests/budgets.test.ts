import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { ValidationError } from "@/lib/categories";
import { monthRange, spendByCategory } from "@/lib/reports";
import {
  validateMonth,
  validateBudgetList,
  upsertBudgets,
  copyBudgets,
  budgetReport,
} from "@/lib/budgets";

describe("validateMonth", () => {
  it("accepts YYYY-MM and returns the first-of-month ISO date", () => {
    expect(validateMonth("2026-02")).toBe("2026-02-01");
  });

  it("rejects an out-of-range month", () => {
    expect(() => validateMonth("2026-13")).toThrow(ValidationError);
    expect(() => validateMonth("2026-00")).toThrow(ValidationError);
  });

  it("rejects a non-zero-padded month", () => {
    expect(() => validateMonth("2026-2")).toThrow(ValidationError);
  });

  it("rejects garbage", () => {
    expect(() => validateMonth("not-a-month")).toThrow(ValidationError);
    expect(() => validateMonth("")).toThrow(ValidationError);
    expect(() => validateMonth(null)).toThrow(ValidationError);
    expect(() => validateMonth(20260101)).toThrow(ValidationError);
  });

  it("bounds the year to 2000..2099", () => {
    expect(() => validateMonth("0000-01")).toThrow(ValidationError);
    expect(() => validateMonth("9999-12")).toThrow(ValidationError);

    const iso = validateMonth("2099-12");
    expect(iso).toBe("2099-12-01");
    // monthRange computes the next-month boundary with plain integer
    // arithmetic (no Date object), so a year rollover at the edge of the
    // bounded range still works.
    expect(monthRange(iso).end).toBe("2100-01-01");
  });
});

describe("validateBudgetList", () => {
  it("rejects a duplicate categoryId", () => {
    expect(() =>
      validateBudgetList({
        month: "2026-02",
        items: [
          { categoryId: 1, amount: 10 },
          { categoryId: 1, amount: 20 },
        ],
      }),
    ).toThrow(ValidationError);
  });

  it("rejects a negative amount", () => {
    expect(() =>
      validateBudgetList({ month: "2026-02", items: [{ categoryId: 1, amount: -5 }] }),
    ).toThrow(ValidationError);
  });

  it("rejects an amount with 3 decimal places", () => {
    expect(() =>
      validateBudgetList({ month: "2026-02", items: [{ categoryId: 1, amount: 19.999 }] }),
    ).toThrow(ValidationError);
    // exactly 2 decimals is fine
    expect(
      validateBudgetList({ month: "2026-02", items: [{ categoryId: 1, amount: 19.99 }] }).items,
    ).toHaveLength(1);
  });

  it("rejects an amount >= 1e12", () => {
    expect(() =>
      validateBudgetList({ month: "2026-02", items: [{ categoryId: 1, amount: 1e12 }] }),
    ).toThrow(ValidationError);
  });

  it("allows a null amount (delete)", () => {
    const { items } = validateBudgetList({ month: "2026-02", items: [{ categoryId: 1, amount: null }] });
    expect(items[0]).toEqual({ categoryId: 1, amount: null });
  });

  it("rejects more than 500 items, allows exactly 500", () => {
    const tooMany = Array.from({ length: 501 }, (_, i) => ({ categoryId: i + 1, amount: 1 }));
    expect(() => validateBudgetList({ month: "2026-02", items: tooMany })).toThrow(ValidationError);

    const ok = Array.from({ length: 500 }, (_, i) => ({ categoryId: i + 1, amount: 1 }));
    expect(validateBudgetList({ month: "2026-02", items: ok }).items).toHaveLength(500);
  });

  it("rejects an unknown top-level field", () => {
    expect(() => validateBudgetList({ month: "2026-02", items: [], nope: true })).toThrow(ValidationError);
  });

  it("rejects an unknown item field", () => {
    expect(() =>
      validateBudgetList({ month: "2026-02", items: [{ categoryId: 1, amount: 1, extra: true }] }),
    ).toThrow(ValidationError);
  });
});

describe("budgets db operations", () => {
  let categoryId: number;
  let category2Id: number;
  let incomeCategoryId: number;
  let visibleAccountId: number;
  let hiddenAccountId: number;

  const MONTH = "2026-09-01";

  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.budgets);
    await db.delete(schema.categories);

    const [category] = await db.insert(schema.categories).values({ name: "Shopping" }).returning();
    categoryId = category.id;
    const [category2] = await db.insert(schema.categories).values({ name: "Food & Drink" }).returning();
    category2Id = category2.id;
    const [income] = await db
      .insert(schema.categories)
      .values({ name: "Income", plaidPrimary: "INCOME" })
      .returning();
    incomeCategoryId = income.id;

    const [item] = await db
      .insert(schema.items)
      .values({ plaidItemId: "item-budgets-test", accessTokenEnc: encrypt("tok") })
      .returning();

    const [visible] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-budgets-visible", name: "Visible Checking", type: "depository", hidden: false })
      .returning();
    visibleAccountId = visible.id;

    const [hidden] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-budgets-hidden", name: "Hidden Checking", type: "depository", hidden: true })
      .returning();
    hiddenAccountId = hidden.id;
  });

  it("upsertBudgets is idempotent", async () => {
    await upsertBudgets(MONTH, [{ categoryId, amount: 100 }]);
    await upsertBudgets(MONTH, [{ categoryId, amount: 100 }]);
    const rows = await db.select().from(schema.budgets).where(and(eq(schema.budgets.categoryId, categoryId), eq(schema.budgets.month, MONTH)));
    expect(rows).toHaveLength(1);
    expect(parseFloat(rows[0].amount)).toBe(100);
  });

  it("upsertBudgets updates an existing row's amount", async () => {
    await upsertBudgets(MONTH, [{ categoryId, amount: 100 }]);
    await upsertBudgets(MONTH, [{ categoryId, amount: 150 }]);
    const rows = await db.select().from(schema.budgets).where(and(eq(schema.budgets.categoryId, categoryId), eq(schema.budgets.month, MONTH)));
    expect(rows).toHaveLength(1);
    expect(parseFloat(rows[0].amount)).toBe(150);
  });

  it("a null amount deletes the row", async () => {
    await upsertBudgets(MONTH, [{ categoryId, amount: 100 }]);
    await upsertBudgets(MONTH, [{ categoryId, amount: null }]);
    const rows = await db.select().from(schema.budgets).where(and(eq(schema.budgets.categoryId, categoryId), eq(schema.budgets.month, MONTH)));
    expect(rows).toHaveLength(0);
  });

  it("rejects a non-existent category with no partial writes", async () => {
    const bogusId = category2Id + 1000;
    await expect(
      upsertBudgets(MONTH, [
        { categoryId, amount: 100 },
        { categoryId: bogusId, amount: 50 },
      ]),
    ).rejects.toBeInstanceOf(ValidationError);

    const rows = await db.select().from(schema.budgets).where(eq(schema.budgets.month, MONTH));
    expect(rows).toHaveLength(0);
  });

  it("copyBudgets without overwrite skips categories that already have a budget in toMonth", async () => {
    const fromMonth = "2026-08-01";
    const toMonth = "2026-09-01";
    await upsertBudgets(fromMonth, [
      { categoryId, amount: 100 },
      { categoryId: category2Id, amount: 200 },
    ]);
    await upsertBudgets(toMonth, [{ categoryId: category2Id, amount: 999 }]);

    const copied = await copyBudgets(fromMonth, toMonth, { overwrite: false });
    expect(copied).toBe(1);

    const rows = await db.select().from(schema.budgets).where(eq(schema.budgets.month, toMonth));
    const byCategory = new Map(rows.map((r) => [r.categoryId, parseFloat(r.amount)]));
    expect(byCategory.get(categoryId)).toBe(100);
    // untouched -- still the pre-existing value, not overwritten
    expect(byCategory.get(category2Id)).toBe(999);
  });

  it("copyBudgets with overwrite replaces existing rows in toMonth", async () => {
    const fromMonth = "2026-08-01";
    const toMonth = "2026-09-01";
    await upsertBudgets(fromMonth, [
      { categoryId, amount: 100 },
      { categoryId: category2Id, amount: 200 },
    ]);
    await upsertBudgets(toMonth, [{ categoryId: category2Id, amount: 999 }]);

    const copied = await copyBudgets(fromMonth, toMonth, { overwrite: true });
    expect(copied).toBe(2);

    const rows = await db.select().from(schema.budgets).where(eq(schema.budgets.month, toMonth));
    const byCategory = new Map(rows.map((r) => [r.categoryId, parseFloat(r.amount)]));
    expect(byCategory.get(categoryId)).toBe(100);
    expect(byCategory.get(category2Id)).toBe(200);
  });

  it("budgetReport: actual is net spend, excludes hidden accounts, removed rows, and other months", async () => {
    await upsertBudgets(MONTH, [{ categoryId, amount: 100 }]);

    await db.insert(schema.transactions).values([
      // Counts: visible account, this month
      { accountId: visibleAccountId, plaidTransactionId: "tx-1", date: "2026-09-05", amount: "30.00", name: "A", categoryId },
      { accountId: visibleAccountId, plaidTransactionId: "tx-2", date: "2026-09-10", amount: "20.00", name: "B", categoryId },
      // Excluded: hidden account
      { accountId: hiddenAccountId, plaidTransactionId: "tx-3", date: "2026-09-06", amount: "500.00", name: "Hidden", categoryId },
      // Excluded: removed
      { accountId: visibleAccountId, plaidTransactionId: "tx-4", date: "2026-09-07", amount: "40.00", name: "Removed", categoryId, isRemoved: true },
      // Excluded: other month
      { accountId: visibleAccountId, plaidTransactionId: "tx-5", date: "2026-08-15", amount: "60.00", name: "OtherMonth", categoryId },
      { accountId: visibleAccountId, plaidTransactionId: "tx-6", date: "2026-10-01", amount: "70.00", name: "NextMonth", categoryId },
      // Counts but nets against the outflow above: a refund in the same
      // category, same month.
      { accountId: visibleAccountId, plaidTransactionId: "tx-7", date: "2026-09-08", amount: "-15.00", name: "Refund", categoryId },
    ]);

    const report = await budgetReport(MONTH);
    const row = report.rows.find((r) => r.categoryId === categoryId)!;
    expect(row.actual).toBe(35); // 30 + 20 - 15
    expect(row.budget).toBe(100);
    expect(row.remaining).toBe(65);
  });

  it("nets refunds within a category: 90 spend and a 15 refund show actual 75 on both budgetReport and spendByCategory", async () => {
    await db.insert(schema.transactions).values([
      { accountId: visibleAccountId, plaidTransactionId: "tx-spend-90", date: "2026-09-05", amount: "90.00", name: "A", categoryId },
      { accountId: visibleAccountId, plaidTransactionId: "tx-refund-15", date: "2026-09-06", amount: "-15.00", name: "Refund", categoryId },
    ]);

    const report = await budgetReport(MONTH);
    const row = report.rows.find((r) => r.categoryId === categoryId)!;
    expect(row.actual).toBe(75);

    const spendRows = await spendByCategory(MONTH);
    const spendRow = spendRows.find((r) => r.name === "Shopping")!;
    expect(parseFloat(spendRow.total)).toBe(75);
  });

  it("budgetReport includes categories with no budget row, remaining is null", async () => {
    const report = await budgetReport(MONTH);
    const row = report.rows.find((r) => r.categoryId === category2Id)!;
    expect(row.budget).toBeNull();
    expect(row.actual).toBe(0);
    expect(row.remaining).toBeNull();
  });

  it("flags income-like categories and excludes them from totals", async () => {
    await upsertBudgets(MONTH, [
      { categoryId, amount: 100 },
      { categoryId: incomeCategoryId, amount: 5000 },
    ]);
    await db.insert(schema.transactions).values([
      { accountId: visibleAccountId, plaidTransactionId: "tx-spend", date: "2026-09-05", amount: "30.00", name: "A", categoryId },
      // Income shows up as a large negative (inflow) amount typically, but
      // even a positive amount posted under Income must not enter totals.
      { accountId: visibleAccountId, plaidTransactionId: "tx-income", date: "2026-09-01", amount: "10.00", name: "Paycheck", categoryId: incomeCategoryId },
    ]);

    const report = await budgetReport(MONTH);
    const incomeRow = report.rows.find((r) => r.categoryId === incomeCategoryId)!;
    expect(incomeRow.isIncomeLike).toBe(true);

    const spendRow = report.rows.find((r) => r.categoryId === categoryId)!;
    expect(spendRow.isIncomeLike).toBe(false);

    // Totals only reflect the non-income-like category.
    expect(report.totals.budget).toBe(100);
    expect(report.totals.actual).toBe(30);
    expect(report.totals.remaining).toBe(70);
  });

  it("copyBudgets rejects from === to", async () => {
    await expect(copyBudgets(MONTH, MONTH, { overwrite: false })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rolls uncategorized spend into a synthetic Uncategorized row counted in totals", async () => {
    await upsertBudgets(MONTH, [{ categoryId, amount: 100 }]);
    await db.insert(schema.transactions).values([
      { accountId: visibleAccountId, plaidTransactionId: "tx-cat", date: "2026-09-05", amount: "30.00", name: "A", categoryId },
      // No categoryId at all.
      { accountId: visibleAccountId, plaidTransactionId: "tx-uncat", date: "2026-09-06", amount: "25.00", name: "B", categoryId: null },
    ]);

    const report = await budgetReport(MONTH);
    const uncategorized = report.rows.find((r) => r.categoryId === null)!;
    expect(uncategorized).toBeDefined();
    expect(uncategorized.name).toBe("Uncategorized");
    expect(uncategorized.budget).toBeNull();
    expect(uncategorized.isIncomeLike).toBe(false);
    expect(uncategorized.actual).toBe(25);

    // Counted in totals.actual alongside the categorized spend.
    expect(report.totals.actual).toBe(55);
  });

  it("omits the Uncategorized row when there is no uncategorized spend", async () => {
    const report = await budgetReport(MONTH);
    expect(report.rows.some((r) => r.categoryId === null)).toBe(false);
  });
});
