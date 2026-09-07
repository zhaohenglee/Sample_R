import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { writeBalanceSnapshots } from "@/lib/sync";
import { cashFlowByMonth, currentMonthIso, netBalanceTrend } from "@/lib/reports";
import { CashFlowBars } from "@/components/charts/CashFlowBars";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { BalanceLine } from "@/components/charts/BalanceLine";

const { items, accounts, transactions, categories, balanceSnapshots } = schema;

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Plain integer arithmetic on year/month, matching src/lib/reports.ts's own
// shiftMonthIso (not exported) -- used here to build fixture dates relative
// to "now" instead of a hardcoded year.
function shiftMonthIso(monthIso: string, delta: number): string {
  const [yearStr, monthStr] = monthIso.slice(0, 7).split("-");
  let year = Number(yearStr);
  let month = Number(monthStr) + delta;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

async function makeItem(plaidItemId: string) {
  const [item] = await db.insert(items).values({ plaidItemId, accessTokenEnc: encrypt("tok") }).returning();
  return item;
}

describe("writeBalanceSnapshots", () => {
  let itemId: number;
  let acc1: number;
  let acc2: number;

  beforeEach(async () => {
    await db.delete(schema.balanceSnapshots);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);

    const item = await makeItem("item-snap");
    itemId = item.id;

    const [a1] = await db.insert(accounts).values({
      itemId, plaidAccountId: "snap-acc-1", name: "Checking", type: "depository",
      currentBalance: "1000.00", availableBalance: "900.00",
    }).returning();
    acc1 = a1.id;

    const [a2] = await db.insert(accounts).values({
      itemId, plaidAccountId: "snap-acc-2", name: "Savings", type: "depository",
      currentBalance: "5000.00", availableBalance: "5000.00",
    }).returning();
    acc2 = a2.id;
  });

  it("writes one snapshot row per account for today", async () => {
    await writeBalanceSnapshots(itemId);
    const rows = await db.select().from(balanceSnapshots);
    expect(rows).toHaveLength(2);
    const byAccount = new Map(rows.map((r) => [r.accountId, r]));
    expect(byAccount.get(acc1)?.current).toBe("1000.00");
    expect(byAccount.get(acc2)?.current).toBe("5000.00");
    expect(byAccount.get(acc1)?.date).toBe(isoDaysAgo(0));
  });

  it("upserts on a second call the same day instead of duplicating", async () => {
    await writeBalanceSnapshots(itemId);
    await db.update(accounts).set({ currentBalance: "1234.56", availableBalance: "1200.00" }).where(eq(accounts.id, acc1));
    await writeBalanceSnapshots(itemId);

    const rows = await db.select().from(balanceSnapshots).where(eq(balanceSnapshots.accountId, acc1));
    expect(rows).toHaveLength(1);
    expect(rows[0].current).toBe("1234.56");
    expect(rows[0].available).toBe("1200.00");

    const allRows = await db.select().from(balanceSnapshots);
    expect(allRows).toHaveLength(2); // acc1 + acc2, still no duplicates
  });
});

describe("cashFlowByMonth", () => {
  let visibleAccountId: number;
  let hiddenAccountId: number;
  let shoppingCatId: number;

  const endMonthIso = currentMonthIso();
  const julyIso = shiftMonthIso(endMonthIso, -2);
  const augustIso = shiftMonthIso(endMonthIso, -1);

  beforeEach(async () => {
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);

    const [shopping] = await db.insert(categories).values({ name: "Shopping" }).returning();
    shoppingCatId = shopping.id;
    const [transferOut] = await db.insert(categories).values({ name: "Transfer Out", plaidPrimary: "TRANSFER_OUT" }).returning();
    const [transferIn] = await db.insert(categories).values({ name: "Transfer In", plaidPrimary: "TRANSFER_IN" }).returning();
    const [income] = await db.insert(categories).values({ name: "Paycheck", plaidPrimary: "INCOME" }).returning();

    const item = await makeItem("item-cashflow");

    const [visible] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "cf-visible", name: "Visible", type: "depository", hidden: false,
    }).returning();
    visibleAccountId = visible.id;

    const [hidden] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "cf-hidden", name: "Hidden", type: "depository", hidden: true,
    }).returning();
    hiddenAccountId = hidden.id;

    await db.insert(transactions).values([
      // July: normal spend + a refund + an income deposit + an own-transfer pair.
      { accountId: visibleAccountId, plaidTransactionId: "cf-jul-out", date: `${julyIso.slice(0, 7)}-15`, amount: "100.00", name: "Store", categoryId: shoppingCatId },
      { accountId: visibleAccountId, plaidTransactionId: "cf-jul-refund", date: `${julyIso.slice(0, 7)}-16`, amount: "-20.00", name: "Refund", categoryId: shoppingCatId },
      { accountId: visibleAccountId, plaidTransactionId: "cf-jul-income", date: `${julyIso.slice(0, 7)}-01`, amount: "-200.00", name: "Paycheck", categoryId: income.id },
      { accountId: visibleAccountId, plaidTransactionId: "cf-jul-xfer-out", date: `${julyIso.slice(0, 7)}-10`, amount: "50.00", name: "To savings", categoryId: transferOut.id },
      { accountId: visibleAccountId, plaidTransactionId: "cf-jul-xfer-in", date: `${julyIso.slice(0, 7)}-10`, amount: "-50.00", name: "From checking", categoryId: transferIn.id },
      // August: nothing -- must come back zero-filled, not omitted.
      // September (endMonthIso): a hidden-account outflow that must be excluded, plus one visible spend.
      { accountId: hiddenAccountId, plaidTransactionId: "cf-sep-hidden", date: `${endMonthIso.slice(0, 7)}-05`, amount: "999.00", name: "Hidden spend", categoryId: shoppingCatId },
      { accountId: visibleAccountId, plaidTransactionId: "cf-sep-out", date: `${endMonthIso.slice(0, 7)}-05`, amount: "45.50", name: "Store", categoryId: shoppingCatId },
    ]);
  });

  it("returns exactly N months in order, zero-filling gaps", async () => {
    const rows = await cashFlowByMonth(endMonthIso, 3);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.month)).toEqual([julyIso, augustIso, endMonthIso]);
    expect(rows[1]).toEqual({ month: augustIso, moneyIn: 0, moneyOut: 0 });
  });

  it("excludes transfers between own accounts but keeps income in moneyIn", async () => {
    const rows = await cashFlowByMonth(endMonthIso, 3);
    const july = rows[0];
    // 100 out (shopping); in = 20 (refund) + 200 (income) = 220. The 50/-50
    // transfer pair contributes to neither side.
    expect(july.moneyOut).toBe(100);
    expect(july.moneyIn).toBe(220);
  });

  it("excludes hidden-account transactions and rounds to cents", async () => {
    const rows = await cashFlowByMonth(endMonthIso, 3);
    const sept = rows[2];
    expect(sept.moneyOut).toBe(45.5);
    expect(sept.moneyIn).toBe(0);
    expect(Number.isInteger(sept.moneyOut * 100)).toBe(true);
  });
});

describe("netBalanceTrend", () => {
  let checkingId: number;
  let creditId: number;
  let hiddenId: number;
  let excludedId: number;
  let savingsId: number;

  const day2 = isoDaysAgo(2);
  const day1 = isoDaysAgo(1);
  const day0 = isoDaysAgo(0);
  const day100 = isoDaysAgo(100);

  beforeEach(async () => {
    await db.delete(schema.balanceSnapshots);
    await db.delete(schema.accounts);
    await db.delete(schema.items);

    const item = await makeItem("item-balance-trend");

    const [checking] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "bt-checking", name: "Checking", type: "depository", hidden: false, excludeFromTotals: false,
    }).returning();
    checkingId = checking.id;

    const [credit] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "bt-credit", name: "Card", type: "credit", hidden: false, excludeFromTotals: false,
    }).returning();
    creditId = credit.id;

    const [hidden] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "bt-hidden", name: "Hidden", type: "depository", hidden: true, excludeFromTotals: false,
    }).returning();
    hiddenId = hidden.id;

    const [excluded] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "bt-excluded", name: "Excluded", type: "depository", hidden: false, excludeFromTotals: true,
    }).returning();
    excludedId = excluded.id;

    const [savings] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "bt-savings", name: "Savings", type: "depository", hidden: false, excludeFromTotals: false,
    }).returning();
    savingsId = savings.id;

    await db.insert(balanceSnapshots).values([
      // checking: present on all three days.
      { accountId: checkingId, date: day2, current: "1000.00", available: "1000.00" },
      { accountId: checkingId, date: day1, current: "1100.00", available: "1100.00" },
      { accountId: checkingId, date: day0, current: "1200.00", available: "1200.00" },
      // credit: present on day2 and day0 only -- day1 must carry forward day2's value.
      { accountId: creditId, date: day2, current: "300.00", available: "300.00" },
      { accountId: creditId, date: day0, current: "400.00", available: "400.00" },
      // hidden and excluded accounts: must never affect the trend.
      { accountId: hiddenId, date: day2, current: "999999.00", available: "999999.00" },
      { accountId: excludedId, date: day2, current: "999999.00", available: "999999.00" },
      // savings: only snapshotted 100 days ago -- outside a 90-day window,
      // so it must be seeded via carry-forward from before the window.
      { accountId: savingsId, date: day100, current: "500.00", available: "500.00" },
    ]);
  });

  it("carries forward a missing account's balance and subtracts credit balances", async () => {
    const rows = await netBalanceTrend(30);
    expect(rows).toHaveLength(3);
    const byDate = new Map(rows.map((r) => [r.date, r.net]));
    // day2: 1000 checking - 300 credit + 500 savings (seeded, pre-window) = 1200
    expect(byDate.get(day2)).toBe(1200);
    // day1: 1100 checking - 300 credit (carried forward from day2) + 500 savings = 1300
    expect(byDate.get(day1)).toBe(1300);
    // day0: 1200 checking - 400 credit + 500 savings = 1300
    expect(byDate.get(day0)).toBe(1300);
  });

  it("excludes hidden and excluded-from-totals accounts entirely", async () => {
    const rows = await netBalanceTrend(30);
    // If the hidden/excluded 999999 balances leaked in, day2's net would be
    // enormous instead of 1200.
    const day2Row = rows.find((r) => r.date === day2)!;
    expect(day2Row.net).toBe(1200);
  });

  it("seeds carry-forward with a snapshot from before the window so a stale account still contributes", async () => {
    // savings was last snapshotted 100 days ago -- outside a 90-day window
    // -- but must still contribute its 500 to every point in the trend.
    const rows = await netBalanceTrend(90);
    const byDate = new Map(rows.map((r) => [r.date, r.net]));
    expect(byDate.get(day0)).toBe(1300);
    expect(byDate.get(day2)).toBe(1200);
  });
});

describe("chart components render accessible, well-formed SVG", () => {
  it("CashFlowBars renders role=img and two bars per month", () => {
    const data = [
      { month: "2026-07-01", moneyIn: 220, moneyOut: 100 },
      { month: "2026-08-01", moneyIn: 0, moneyOut: 0 },
      { month: "2026-09-01", moneyIn: 0, moneyOut: 45.5 },
    ];
    const html = renderToStaticMarkup(CashFlowBars({ data }));
    expect(html).toContain('role="img"');
    // 3 months * 2 bars each = 6 bar <path> elements, plus 0 area paths.
    expect((html.match(/<path/g) ?? []).length).toBe(6);
  });

  it("CategoryBars renders role=img and one bar per category, using periodLabel in the summary", () => {
    const data = [
      { categoryId: 1, name: "Groceries", amount: 420.5 },
      { categoryId: 2, name: "Rent", amount: 1500 },
      { categoryId: null, name: "Uncategorized", amount: 32.1 },
    ];
    const html = renderToStaticMarkup(CategoryBars({ data, periodLabel: "in 2026-03" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("Spend by category in 2026-03");
    expect((html.match(/<path/g) ?? []).length).toBe(3);
  });

  it("CategoryBars renders role=img with no bars when data is empty", () => {
    const html = renderToStaticMarkup(CategoryBars({ data: [], periodLabel: "this month" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("Spend by category this month");
    expect((html.match(/<path/g) ?? []).length).toBe(0);
  });

  it("BalanceLine renders role=img with a line path and an area path", () => {
    const data = [
      { date: "2026-08-01", net: 1000 },
      { date: "2026-08-15", net: 1200 },
      { date: "2026-09-01", net: 900 },
    ];
    const html = renderToStaticMarkup(BalanceLine({ data }));
    expect(html).toContain('role="img"');
    // exactly 2 <path> elements: the area fill and the line itself.
    expect((html.match(/<path/g) ?? []).length).toBe(2);
  });

  it("BalanceLine renders role=img with no line when there is no data", () => {
    const html = renderToStaticMarkup(BalanceLine({ data: [] }));
    expect(html).toContain('role="img"');
    expect((html.match(/<path/g) ?? []).length).toBe(0);
  });
});
