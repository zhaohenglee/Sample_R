import { describe, it, expect, beforeEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import {
  normalizeMerchantKey,
  detectRecurring,
  refreshRecurring,
  upcomingRecurring,
  type RecurringTx,
} from "@/lib/recurring";

const { items, accounts, transactions, recurring } = schema;

// --- date helpers (mirrors tests/charts.test.ts's isoDaysAgo style) -------

function addDaysToIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A fixed "today" for the pure detectRecurring tests -- detectRecurring
// takes `today` as an explicit argument, so these tests don't depend on
// the real clock at all.
const TODAY = "2026-06-15";
function back(n: number): string {
  return addDaysToIso(TODAY, -n);
}

let nextTxId = 1;
function tx(overrides: Partial<RecurringTx>): RecurringTx {
  return {
    id: nextTxId++,
    accountId: 1,
    date: TODAY,
    amount: 10,
    name: "Merchant",
    merchantName: null,
    categoryId: null,
    ...overrides,
  };
}

describe("normalizeMerchantKey", () => {
  it("lower cases", () => {
    expect(normalizeMerchantKey("STARBUCKS")).toBe("starbucks");
  });

  it("strips digits and punctuation and collapses the resulting whitespace", () => {
    expect(normalizeMerchantKey("Starbucks #1234 Store")).toBe("starbucks store");
  });

  it("collapses repeated whitespace and trims", () => {
    expect(normalizeMerchantKey("  Whole Foods   Market  ")).toBe("whole foods market");
  });

  it("truncates to 40 characters", () => {
    const long = "a".repeat(50);
    const result = normalizeMerchantKey(long);
    expect(result).toHaveLength(40);
    expect(result).toBe("a".repeat(40));
  });

  it("groups two postings of the same merchant with different numeric/punctuation suffixes to the same key", () => {
    const a = normalizeMerchantKey("Netflix.com 04/12");
    const b = normalizeMerchantKey("NETFLIX.COM 05/13");
    expect(a).toBe(b);
    expect(a).toBe("netflixcom");
  });
});

describe("detectRecurring", () => {
  it("detects a monthly rent charge from 3 occurrences ~30/31 days apart", () => {
    const txs = [
      tx({ date: back(62), amount: 1500, name: "Rent", merchantName: "Landlord LLC" }),
      tx({ date: back(31), amount: 1500, name: "Rent", merchantName: "Landlord LLC" }),
      tx({ date: back(0), amount: 1500, name: "Rent", merchantName: "Landlord LLC" }),
    ];
    const candidates = detectRecurring(txs, TODAY);
    expect(candidates).toHaveLength(1);
    const c = candidates[0];
    expect(c.cadence).toBe("monthly");
    expect(c.occurrences).toBe(3);
    expect(c.expectedAmount).toBe(1500);
    expect(c.lastDate).toBe(back(0));
    expect(c.displayName).toBe("Landlord LLC");
  });

  it("computes next_due as the same day next calendar month", () => {
    const txs = [
      tx({ date: back(62), amount: 1500, merchantName: "Landlord LLC" }),
      tx({ date: back(31), amount: 1500, merchantName: "Landlord LLC" }),
      tx({ date: back(0), amount: 1500, merchantName: "Landlord LLC" }),
    ];
    const [c] = detectRecurring(txs, TODAY);
    // last_date is TODAY (2026-06-15) -> next calendar month, same day.
    expect(c.lastDate).toBe("2026-06-15");
    expect(c.nextDue).toBe("2026-07-15");
  });

  it("next_due is calendar aware: monthly clamps to the last day of a shorter target month", () => {
    const txs = [
      tx({ date: "2025-11-30", amount: 1200, merchantName: "Calendar Rent" }),
      tx({ date: "2025-12-31", amount: 1200, merchantName: "Calendar Rent" }),
      tx({ date: "2026-01-31", amount: 1200, merchantName: "Calendar Rent" }),
    ];
    const [c] = detectRecurring(txs, "2026-01-31");
    expect(c.cadence).toBe("monthly");
    expect(c.lastDate).toBe("2026-01-31");
    // 2026 is not a leap year, so Jan 31 + 1 month clamps to Feb 28.
    expect(c.nextDue).toBe("2026-02-28");
  });

  it("next_due is calendar aware: yearly Feb 29 rolls to Feb 28 the following (non-leap) year", () => {
    const txs = [
      tx({ date: "2022-02-28", amount: 50, merchantName: "Leap Sub" }),
      tx({ date: "2023-02-28", amount: 50, merchantName: "Leap Sub" }),
      tx({ date: "2024-02-29", amount: 50, merchantName: "Leap Sub" }),
    ];
    const [c] = detectRecurring(txs, "2024-03-01");
    expect(c.cadence).toBe("yearly");
    expect(c.lastDate).toBe("2024-02-29");
    expect(c.nextDue).toBe("2025-02-28");
  });

  it("detects a weekly charge from occurrences ~7 days apart", () => {
    const txs = [
      tx({ date: back(21), amount: 12, merchantName: "Gym Weekly" }),
      tx({ date: back(14), amount: 12, merchantName: "Gym Weekly" }),
      tx({ date: back(7), amount: 12, merchantName: "Gym Weekly" }),
      tx({ date: back(0), amount: 12, merchantName: "Gym Weekly" }),
    ];
    const [c] = detectRecurring(txs, TODAY);
    expect(c.cadence).toBe("weekly");
    expect(c.nextDue).toBe(addDaysToIso(back(0), 7));
  });

  it("detects a yearly subscription with only 3 points", () => {
    const txs = [
      tx({ date: back(730), amount: 99, merchantName: "Annual Plan" }),
      tx({ date: back(365), amount: 99, merchantName: "Annual Plan" }),
      tx({ date: back(0), amount: 99, merchantName: "Annual Plan" }),
    ];
    const [c] = detectRecurring(txs, TODAY);
    expect(c.cadence).toBe("yearly");
    expect(c.occurrences).toBe(3);
  });

  it("does not flag an irregular coffee habit with varying gaps", () => {
    const txs = [
      tx({ date: back(40), amount: 5, merchantName: "Corner Coffee" }),
      tx({ date: back(25), amount: 5, merchantName: "Corner Coffee" }),
      tx({ date: back(9), amount: 5, merchantName: "Corner Coffee" }),
      tx({ date: back(0), amount: 5, merchantName: "Corner Coffee" }),
    ];
    expect(detectRecurring(txs, TODAY)).toHaveLength(0);
  });

  it("does not flag a group whose amounts vary more than 15% from the median", () => {
    const txs = [
      tx({ date: back(62), amount: 50, merchantName: "Variable Co" }),
      tx({ date: back(31), amount: 50, merchantName: "Variable Co" }),
      tx({ date: back(0), amount: 80, merchantName: "Variable Co" }),
    ];
    expect(detectRecurring(txs, TODAY)).toHaveLength(0);
  });

  it("collapses same-day duplicate postings into one occurrence (summed amount) before checking amounts/intervals", () => {
    const txs = [
      tx({ date: back(62), amount: 1500, merchantName: "Split Rent" }),
      // Rent paid in two installments that post the same day.
      tx({ date: back(31), amount: 750, merchantName: "Split Rent" }),
      tx({ date: back(31), amount: 750, merchantName: "Split Rent" }),
      tx({ date: back(0), amount: 1500, merchantName: "Split Rent" }),
    ];
    const candidates = detectRecurring(txs, TODAY);
    expect(candidates).toHaveLength(1);
    const c = candidates[0];
    expect(c.cadence).toBe("monthly");
    expect(c.occurrences).toBe(3);
    expect(c.expectedAmount).toBe(1500);
  });

  it("does not flag a group with only 2 occurrences", () => {
    const txs = [
      tx({ date: back(31), amount: 15, merchantName: "Too Few" }),
      tx({ date: back(0), amount: 15, merchantName: "Too Few" }),
    ];
    expect(detectRecurring(txs, TODAY)).toHaveLength(0);
  });

  it("does not flag a monthly-shaped group whose last occurrence is over 2 cadence periods stale", () => {
    const txs = [
      tx({ date: back(152), amount: 20, merchantName: "Lapsed Sub" }),
      tx({ date: back(121), amount: 20, merchantName: "Lapsed Sub" }),
      tx({ date: back(90), amount: 20, merchantName: "Lapsed Sub" }),
    ];
    // 90 days ago is well over 2 * 30.44 (~61 days) before "today".
    expect(detectRecurring(txs, TODAY)).toHaveLength(0);
  });

  it("yields two separate candidates for the same merchant on two different accounts", () => {
    const txs = [
      tx({ accountId: 1, date: back(62), amount: 15.99, merchantName: "Streaming Co" }),
      tx({ accountId: 1, date: back(31), amount: 15.99, merchantName: "Streaming Co" }),
      tx({ accountId: 1, date: back(0), amount: 15.99, merchantName: "Streaming Co" }),
      tx({ accountId: 2, date: back(62), amount: 15.99, merchantName: "Streaming Co" }),
      tx({ accountId: 2, date: back(31), amount: 15.99, merchantName: "Streaming Co" }),
      tx({ accountId: 2, date: back(0), amount: 15.99, merchantName: "Streaming Co" }),
    ];
    const candidates = detectRecurring(txs, TODAY);
    expect(candidates).toHaveLength(2);
    expect(candidates.map((c) => c.accountId).sort()).toEqual([1, 2]);
  });

  it("ignores money-in rows (amount <= 0) entirely", () => {
    const txs = [
      tx({ date: back(62), amount: -15.99, merchantName: "Refund Co" }),
      tx({ date: back(31), amount: -15.99, merchantName: "Refund Co" }),
      tx({ date: back(0), amount: -15.99, merchantName: "Refund Co" }),
    ];
    expect(detectRecurring(txs, TODAY)).toHaveLength(0);
  });
});

// --- DB-integration tests --------------------------------------------------

async function makeItem(plaidItemId: string) {
  const [item] = await db.insert(items).values({ plaidItemId, accessTokenEnc: encrypt("tok") }).returning();
  return item;
}

describe("refreshRecurring", () => {
  let visibleAccountId: number;
  let hiddenAccountId: number;
  let seq = 0;
  const nextPlaidId = () => `recurring-tx-${++seq}`;

  beforeEach(async () => {
    seq = 0;
    await db.delete(schema.recurring);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);

    const item = await makeItem("item-recurring");

    const [visible] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "rec-visible", name: "Checking", type: "depository", hidden: false,
    }).returning();
    visibleAccountId = visible.id;

    const [hidden] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "rec-hidden", name: "Hidden", type: "depository", hidden: true,
    }).returning();
    hiddenAccountId = hidden.id;

    // A clean monthly pattern on the visible account -- should be detected.
    for (const n of [62, 31, 0]) {
      await db.insert(transactions).values({
        accountId: visibleAccountId,
        plaidTransactionId: nextPlaidId(),
        date: isoDaysAgo(n),
        amount: "15.99",
        name: "Streaming Co",
        merchantName: "Streaming Co",
        isPending: false,
        isRemoved: false,
      });
    }

    // Same monthly pattern, but two of the three postings and one pending
    // row -- pending must be excluded, leaving only 2 real occurrences.
    for (const n of [31, 0]) {
      await db.insert(transactions).values({
        accountId: visibleAccountId,
        plaidTransactionId: nextPlaidId(),
        date: isoDaysAgo(n),
        amount: "9.00",
        name: "Pending Only",
        merchantName: "Pending Only",
        isPending: false,
        isRemoved: false,
      });
    }
    await db.insert(transactions).values({
      accountId: visibleAccountId,
      plaidTransactionId: nextPlaidId(),
      date: isoDaysAgo(62),
      amount: "9.00",
      name: "Pending Only",
      merchantName: "Pending Only",
      isPending: true,
      isRemoved: false,
    });

    // Same shape, but the third occurrence is removed -- must also be
    // excluded, leaving only 2 real occurrences.
    for (const n of [31, 0]) {
      await db.insert(transactions).values({
        accountId: visibleAccountId,
        plaidTransactionId: nextPlaidId(),
        date: isoDaysAgo(n),
        amount: "7.00",
        name: "Removed Only",
        merchantName: "Removed Only",
        isPending: false,
        isRemoved: false,
      });
    }
    await db.insert(transactions).values({
      accountId: visibleAccountId,
      plaidTransactionId: nextPlaidId(),
      date: isoDaysAgo(62),
      amount: "7.00",
      name: "Removed Only",
      merchantName: "Removed Only",
      isPending: false,
      isRemoved: true,
    });

    // The same clean monthly pattern, but on a hidden account -- must be
    // excluded entirely.
    for (const n of [62, 31, 0]) {
      await db.insert(transactions).values({
        accountId: hiddenAccountId,
        plaidTransactionId: nextPlaidId(),
        date: isoDaysAgo(n),
        amount: "5.00",
        name: "Hidden Sub",
        merchantName: "Hidden Sub",
        isPending: false,
        isRemoved: false,
      });
    }
  });

  it("detects only the visible, posted, non-removed pattern", async () => {
    const count = await refreshRecurring();
    expect(count).toBe(1);

    const rows = await db.select().from(recurring);
    expect(rows).toHaveLength(1);
    expect(rows[0].displayName).toBe("Streaming Co");
    expect(rows[0].accountId).toBe(visibleAccountId);
    expect(rows[0].occurrences).toBe(3);
  });

  it("replaces all rows on a second run instead of duplicating", async () => {
    await refreshRecurring();
    const count2 = await refreshRecurring();
    expect(count2).toBe(1);

    const rows = await db.select().from(recurring);
    expect(rows).toHaveLength(1);
  });

  it("detects a yearly cadence spanning ~730 days now that the lookback window covers it", async () => {
    for (const n of [730, 365, 3]) {
      await db.insert(transactions).values({
        accountId: visibleAccountId,
        plaidTransactionId: nextPlaidId(),
        date: isoDaysAgo(n),
        amount: "120.00",
        name: "Annual Plan",
        merchantName: "Annual Plan",
        isPending: false,
        isRemoved: false,
      });
    }

    await refreshRecurring();

    const rows = await db.select().from(recurring).where(eq(recurring.merchantKey, normalizeMerchantKey("Annual Plan")));
    expect(rows).toHaveLength(1);
    expect(rows[0].cadence).toBe("yearly");
    expect(rows[0].occurrences).toBe(3);
  });
});

describe("refreshRecurring atomicity", () => {
  let visibleAccountId: number;
  let seq = 0;
  const nextPlaidId = () => `atomic-tx-${++seq}`;

  beforeEach(async () => {
    seq = 0;
    await db.delete(schema.recurring);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);

    const item = await makeItem("item-atomic");
    const [visible] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "atomic-visible", name: "Checking", type: "depository", hidden: false,
    }).returning();
    visibleAccountId = visible.id;

    // Many distinct recurring merchants so the replacing delete+insert has
    // enough rows to take measurable time, widening any window a broken
    // (non-transactional) delete-then-insert would expose to a reader.
    for (let m = 0; m < 30; m++) {
      for (const n of [62, 31, 0]) {
        await db.insert(transactions).values({
          accountId: visibleAccountId,
          plaidTransactionId: nextPlaidId(),
          date: isoDaysAgo(n),
          amount: "9.99",
          name: `Merchant ${m}`,
          merchantName: `Merchant ${m}`,
          isPending: false,
          isRemoved: false,
        });
      }
    }

    // Populate the table once up front so it is non-empty before the test's
    // concurrent refresh starts.
    await refreshRecurring();
  });

  it("never lets a concurrent reader see an empty table while refreshRecurring replaces its rows", async () => {
    const before = await db.select().from(recurring);
    expect(before.length).toBeGreaterThan(0);

    // Several independent readers (raw `select count(*)`), each looping as
    // fast as it can on its own connection until the refresh finishes, so
    // together they sample continuously across the whole duration of the
    // concurrent refreshRecurring() call -- not just at fixed instants that
    // might miss a brief unprotected window.
    let done = false;
    async function pollCountsUntilDone(): Promise<number[]> {
      const counts: number[] = [];
      while (!done) {
        const rows = await db.execute<{ count: string }>(sql`select count(*)::text as count from "recurring"`);
        counts.push(Number(rows[0].count));
      }
      return counts;
    }

    const pollers = Array.from({ length: 8 }, () => pollCountsUntilDone());
    const refreshPromise = refreshRecurring().finally(() => {
      done = true;
    });

    const [, ...pollResults] = await Promise.all([refreshPromise, ...pollers]);
    const allCounts = pollResults.flat();

    // Sanity check that the readers actually got to run at all (how many
    // depends on how long the refresh itself takes, so this is a low bar,
    // not a target).
    expect(allCounts.length).toBeGreaterThan(0);
    // If delete and insert ever ran as two separate, non-transactional
    // writes, a reader could observe the table between them -- empty after
    // the delete, before the insert lands. db.transaction (delete + insert
    // as one commit) rules that out: every read sees either the old rows
    // or the new rows, never neither.
    expect(allCounts.every((c) => c > 0)).toBe(true);
  });
});

describe("upcomingRecurring", () => {
  let accountId: number;

  beforeEach(async () => {
    await db.delete(schema.recurring);
    await db.delete(schema.accounts);
    await db.delete(schema.items);

    const item = await makeItem("item-upcoming");
    const [account] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "up-acc", name: "Checking", nickname: "Main Checking", type: "depository", hidden: false,
    }).returning();
    accountId = account.id;

    await db.insert(recurring).values([
      {
        merchantKey: "gym", displayName: "Gym", cadence: "monthly", expectedAmount: "40.00",
        lastDate: isoDaysAgo(25), nextDue: isoDaysAgo(-5), occurrences: 3, accountId,
      },
      {
        merchantKey: "netflix", displayName: "Netflix", cadence: "monthly", expectedAmount: "15.99",
        lastDate: isoDaysAgo(5), nextDue: isoDaysAgo(-25), occurrences: 3, accountId,
      },
      // Too far in the future -- outside the today+30 upper bound.
      {
        merchantKey: "insurance", displayName: "Insurance", cadence: "yearly", expectedAmount: "600.00",
        lastDate: isoDaysAgo(320), nextDue: isoDaysAgo(-45), occurrences: 3, accountId,
      },
      {
        merchantKey: "duesoon", displayName: "Due Today", cadence: "monthly", expectedAmount: "10.00",
        lastDate: isoDaysAgo(30), nextDue: isoDaysAgo(0), occurrences: 3, accountId,
      },
      // 3 days overdue -- inside the 7-day overdue lookback, so it shows up
      // flagged rather than dropping off the list.
      {
        merchantKey: "overdue", displayName: "Overdue Recent", cadence: "monthly", expectedAmount: "20.00",
        lastDate: isoDaysAgo(33), nextDue: isoDaysAgo(3), occurrences: 3, accountId,
      },
      // 10 days overdue -- outside the 7-day overdue lookback entirely.
      {
        merchantKey: "waypastdue", displayName: "Way Past Due", cadence: "monthly", expectedAmount: "10.00",
        lastDate: isoDaysAgo(40), nextDue: isoDaysAgo(10), occurrences: 3, accountId,
      },
    ]);
  });

  it("returns rows due between today-7 and today+days, ordered by next_due ascending", async () => {
    const rows = await upcomingRecurring(30);
    expect(rows.map((r) => r.displayName)).toEqual(["Overdue Recent", "Due Today", "Gym", "Netflix"]);
  });

  it("flags overdue: true only for rows whose next_due is before today", async () => {
    const rows = await upcomingRecurring(30);
    const byName = new Map(rows.map((r) => [r.displayName, r.overdue]));
    expect(byName.get("Overdue Recent")).toBe(true);
    expect(byName.get("Due Today")).toBe(false);
    expect(byName.get("Gym")).toBe(false);
    expect(byName.get("Netflix")).toBe(false);
  });

  it("joins the account label", async () => {
    const rows = await upcomingRecurring(30);
    expect(rows.every((r) => r.accountLabel === "Main Checking")).toBe(true);
  });

  it("excludes rows outside the window on either side", async () => {
    const rows = await upcomingRecurring(30);
    expect(rows.some((r) => r.displayName === "Insurance")).toBe(false);
    expect(rows.some((r) => r.displayName === "Way Past Due")).toBe(false);
  });

  it("excludes a recurring row whose account was hidden after it was detected", async () => {
    const item = await makeItem("item-upcoming-hide");
    const [hideLater] = await db.insert(accounts).values({
      itemId: item.id, plaidAccountId: "up-hide-later", name: "Side Account", type: "depository", hidden: false,
    }).returning();
    await db.insert(recurring).values({
      merchantKey: "side", displayName: "Side Sub", cadence: "monthly", expectedAmount: "5.00",
      lastDate: isoDaysAgo(30), nextDue: isoDaysAgo(-5), occurrences: 3, accountId: hideLater.id,
    });

    let rows = await upcomingRecurring(30);
    expect(rows.some((r) => r.displayName === "Side Sub")).toBe(true);

    await db.update(accounts).set({ hidden: true }).where(eq(accounts.id, hideLater.id));

    rows = await upcomingRecurring(30);
    expect(rows.some((r) => r.displayName === "Side Sub")).toBe(false);
  });
});
