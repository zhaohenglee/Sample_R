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
    ]);
  });

  it("spendByCategory excludes hidden-account spend", async () => {
    const rows = await spendByCategory(MONTH_ISO);
    const shopping = rows.find((r) => r.name === "Shopping");
    expect(shopping).toBeDefined();
    expect(parseFloat(shopping!.total)).toBe(20);
  });

  it("monthFlow excludes hidden-account amounts", async () => {
    const flow = await monthFlow(MONTH_ISO);
    expect(parseFloat(flow.out)).toBe(20);
  });

  it("recentTransactions excludes hidden-account rows", async () => {
    const rows = await recentTransactions(10);
    expect(rows.some((r) => r.name === "Hidden Store")).toBe(false);
    expect(rows.some((r) => r.name === "Visible Store")).toBe(true);
  });
});
