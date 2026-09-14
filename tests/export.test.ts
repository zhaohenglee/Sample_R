// T6.4 export: CSV export shares its filters with the transactions page
// (src/lib/transactions.ts's transactionListQuery), and the JSON backup
// must never leak items.access_token_enc. See docs/TASKS.md T6.4.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db, schema } from "@/db";
import { encrypt } from "@/lib/crypto";
import { parseCsv } from "@/lib/csv";
import { sessionToken } from "@/lib/auth";
import { transactionListQuery } from "@/lib/transactions";
import { buildBackup, backupTables, BACKUP_SECRET_COLUMNS, transactionsToCsv, type BackupItemRow, type ExportTransactionRow } from "@/lib/export";
import { getTableColumns, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

const { items, accounts, transactions, categories } = schema;

beforeEach(async () => {
  // items cascades accounts -> transactions/balanceSnapshots/recurring;
  // categories cascades categoryRules/budgets. See src/db/schema.ts.
  await db.delete(items);
  await db.delete(categories);
});

// ---------------------------------------------------------------------------
// CSV round trip (pure -- no DB)
// ---------------------------------------------------------------------------

describe("transactionsToCsv", () => {
  it("round trips fields containing commas, quotes, and embedded newlines through parseCsv", () => {
    const rows: ExportTransactionRow[] = [
      {
        id: 1,
        date: "2026-01-05",
        name: "Raw name",
        merchant: null,
        displayName: 'Coffee, "Downtown"\nShop',
        notes: 'line one\nline two, with a comma and "quotes"',
        amount: "4.50",
        pending: false,
        categoryId: null,
        categoryName: null,
        plaidCategory: null,
        account: "Checking",
        accountNickname: null,
        mask: null,
        ruleId: null,
        ruleName: null,
        source: "plaid",
      },
    ];

    const csv = transactionsToCsv(rows);
    const parsed = parseCsv(csv);

    expect(parsed.headers).toEqual(["Date", "Description", "Account", "Category", "Amount (negative = money out)", "Notes", "Pending", "Source"]);
    expect(parsed.rows).toHaveLength(1);
    const fields = parsed.rows[0].fields;
    expect(fields[0]).toBe("2026-01-05");
    expect(fields[1]).toBe('Coffee, "Downtown"\nShop'); // description: comma + quotes + newline
    expect(fields[2]).toBe("Checking");
    expect(fields[5]).toBe('line one\nline two, with a comma and "quotes"'); // notes: comma + quotes + newline
  });

  it("leaves a plain field unquoted", () => {
    const rows: ExportTransactionRow[] = [
      {
        id: 2,
        date: "2026-01-06",
        name: "Plain",
        merchant: null,
        displayName: null,
        notes: null,
        amount: "10.00",
        pending: false,
        categoryId: null,
        categoryName: null,
        plaidCategory: null,
        account: "Checking",
        accountNickname: null,
        mask: null,
        ruleId: null,
        ruleName: null,
        source: "plaid",
      },
    ];
    const csv = transactionsToCsv(rows);
    expect(csv.split("\r\n")[1]).toBe("2026-01-06,Plain,Checking,Uncategorized,-10,,no,plaid");
  });
});

// ---------------------------------------------------------------------------
// Filter parity with the transactions page (shared transactionListQuery)
// ---------------------------------------------------------------------------

describe("export rows match the transactions page's filters exactly", () => {
  it("excludes removed transactions and hidden-account transactions, in the same desc(date, id) order the page uses", async () => {
    const [item] = await db.insert(items).values({ plaidItemId: "item-export-1", accessTokenEnc: encrypt("tok") }).returning();
    const [visibleAccount] = await db
      .insert(accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-export-visible", name: "Checking", type: "depository", hidden: false })
      .returning();
    const [hiddenAccount] = await db
      .insert(accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-export-hidden", name: "Old Card", type: "credit", hidden: true })
      .returning();

    // Visible, kept.
    await db.insert(transactions).values({
      accountId: visibleAccount.id, plaidTransactionId: "tx-export-later", date: "2026-01-20", amount: "9.00", name: "Later",
    });
    await db.insert(transactions).values({
      accountId: visibleAccount.id, plaidTransactionId: "tx-export-coffee", date: "2026-01-05", amount: "4.50", name: "Coffee Shop",
    });
    // Removed -- must not appear.
    await db.insert(transactions).values({
      accountId: visibleAccount.id, plaidTransactionId: "tx-export-removed", date: "2026-01-10", amount: "20.00", name: "Grocery",
      isRemoved: true,
    });
    // On a hidden account -- must not appear.
    await db.insert(transactions).values({
      accountId: hiddenAccount.id, plaidTransactionId: "tx-export-hidden", date: "2026-01-07", amount: "15.00", name: "Hidden Tx",
    });
    // Outside the from/to window given below -- must not appear.
    await db.insert(transactions).values({
      accountId: visibleAccount.id, plaidTransactionId: "tx-export-old", date: "2026-01-01", amount: "3.00", name: "Too Old",
    });

    const params = { from: "2026-01-04", to: "2026-01-31" };
    const expected = await transactionListQuery(params); // no limit/offset: every matching row
    const csv = transactionsToCsv(await transactionListQuery(params));
    const parsed = parseCsv(csv);

    // Same count as the shared query.
    expect(parsed.rows).toHaveLength(expected.length);
    expect(parsed.rows).toHaveLength(2);
    // Same order: desc(date), so "Later" (01-20) before "Coffee Shop" (01-05).
    expect(parsed.rows.map((r) => r.fields[1])).toEqual(["Later", "Coffee Shop"]);
    // Removed and hidden-account rows never appear.
    const descriptions = parsed.rows.map((r) => r.fields[1]);
    expect(descriptions).not.toContain("Grocery");
    expect(descriptions).not.toContain("Hidden Tx");
    expect(descriptions).not.toContain("Too Old");
  });

  it("applies the q, account, and category filters the same way the page does", async () => {
    const [item] = await db.insert(items).values({ plaidItemId: "item-export-2", accessTokenEnc: encrypt("tok") }).returning();
    const [accountA] = await db
      .insert(accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-export-a", name: "Checking", type: "depository" })
      .returning();
    const [accountB] = await db
      .insert(accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-export-b", name: "Savings", type: "depository" })
      .returning();
    const [category] = await db.insert(categories).values({ name: "Dining" }).returning();

    await db.insert(transactions).values({
      accountId: accountA.id, plaidTransactionId: "tx-export-match", date: "2026-02-01", amount: "12.00", name: "Sushi Bar",
      categoryId: category.id,
    });
    await db.insert(transactions).values({
      accountId: accountA.id, plaidTransactionId: "tx-export-no-cat", date: "2026-02-02", amount: "8.00", name: "Sushi Takeout",
    });
    await db.insert(transactions).values({
      accountId: accountB.id, plaidTransactionId: "tx-export-other-account", date: "2026-02-03", amount: "12.00", name: "Sushi Bar",
      categoryId: category.id,
    });

    const params = { q: "sushi", account: String(accountA.id), category: String(category.id) };
    const csv = transactionsToCsv(await transactionListQuery(params));
    const parsed = parseCsv(csv);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].fields[1]).toBe("Sushi Bar");
    expect(parsed.rows[0].fields[2]).toBe("Checking");
  });
});

// ---------------------------------------------------------------------------
// Secrets never leave the database via the JSON backup
// ---------------------------------------------------------------------------

describe("shared filter guards", () => {
  async function seed() {
    const [item] = await db.insert(items).values({ plaidItemId: "item-guards", accessTokenEnc: encrypt("tok") }).returning();
    const [account] = await db
      .insert(accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-guards", name: "Checking", type: "depository", hidden: false })
      .returning();
    await db.insert(transactions).values([
      { accountId: account.id, plaidTransactionId: "g-1", date: "2026-03-01", amount: "4.50", name: "Coffee Shop" },
      { accountId: account.id, plaidTransactionId: "g-2", date: "2026-03-01", amount: "9.00", name: "Coffee Beans" },
      { accountId: account.id, plaidTransactionId: "g-3", date: "2026-03-01", amount: "12.00", name: "Hardware Store" },
      { accountId: account.id, plaidTransactionId: "g-4", date: "2026-02-01", amount: "20.00", name: "Grocery" },
      // Enough same-date rows that an unspecified order matching descending
      // id by luck is not a plausible way for this test to pass.
      ...Array.from({ length: 20 }, (_, i) => ({
        accountId: account.id,
        plaidTransactionId: `g-tie-${i}`,
        date: "2026-03-01",
        amount: "1.00",
        name: `Tie ${i}`,
      })),
    ]);
    return account;
  }

  // Finding from validation: deleting the search filter entirely left the
  // suite green, because the one test using `q` also passed account and
  // category, and those alone already narrowed the fixture to one row.
  // Without it every filtered export returns the whole ledger.
  it("the search filter alone narrows the result", async () => {
    await seed();
    const all = await transactionListQuery({});
    const searched = await transactionListQuery({ q: "coffee" });
    expect(all).toHaveLength(24);
    expect(searched).toHaveLength(2);
    for (const row of searched) {
      expect(row.name.toLowerCase()).toContain("coffee");
    }
  });

  // Finding from validation: removing the desc(id) tie-breaker left the
  // suite green because the ordering test's rows had distinct dates.
  // Without it, ordering across same-date rows is unspecified, which breaks
  // both the "same order" criterion and LIMIT/OFFSET pagination stability
  // (rows can repeat or vanish between pages).
  //
  // This asserts the generated SQL rather than the returned order, on
  // purpose. Behaviourally the tie-breaker is nearly untestable here:
  // Postgres happens to return these rows in descending id anyway, so a
  // result-order assertion passes with the tie-breaker deleted, even with
  // twenty-odd same-date rows. Unspecified is not the same as wrong, and a
  // test that cannot fail is worse than none.
  it("orders by date then id, so same-date rows have a defined order", async () => {
    const { sql: text } = transactionListQuery({}).toSQL();
    const orderBy = text.slice(text.lastIndexOf("order by"));
    expect(orderBy).toContain('"date" desc');
    expect(orderBy).toContain('"id" desc');
  });

  it("returns same-date rows in descending id order", async () => {
    await seed();
    const sameDate = await transactionListQuery({ from: "2026-03-01", to: "2026-03-01" });
    expect(sameDate).toHaveLength(23);
    const ids = sameDate.map((r) => r.id);
    expect(ids).toEqual([...ids].sort((a, b) => b - a));
  });
});

describe("buildBackup", () => {
  it("never includes access_token_enc anywhere in the serialized payload", async () => {
    const encryptedToken = encrypt("plaid-access-token-should-never-leave-the-db");
    await db.insert(items).values({
      plaidItemId: "item-secret-test",
      accessTokenEnc: encryptedToken,
      institutionName: "Test Bank",
    });

    const backup = await buildBackup();
    // Sanity check first: the item really is in the backup, so the
    // assertions below aren't vacuously true because the table was empty.
    const backupItems = backup.items as BackupItemRow[];
    expect(backupItems.some((i) => i.institutionName === "Test Bank")).toBe(true);

    // Assert on the WHOLE serialized payload, not one field -- a future
    // column added anywhere in the schema (renamed, or on a different
    // table) that happened to carry this value would still be caught here.
    const serialized = JSON.stringify(backup);
    expect(serialized).not.toContain(encryptedToken);
    expect(serialized).not.toContain("accessTokenEnc");
    expect(serialized).not.toContain("access_token_enc");
  });

  // Finding from validation: the backup silently omitted `goals` the moment
  // that table was added, and a user restoring from it would have lost every
  // goal with nothing to notice. The table list is now derived from the
  // schema; this asserts the derivation actually covers everything, so the
  // next table cannot go missing the same way.
  it("covers every table in the schema", async () => {
    const backup = await buildBackup();
    const schemaTables = Object.entries(schema)
      .filter(([, value]) => is(value, PgTable))
      .map(([name]) => name);

    expect(schemaTables.length).toBeGreaterThan(0);
    for (const name of schemaTables) {
      expect(Object.keys(backup)).toContain(name);
    }
  });

  // The secret exclusion is a denylist, which fails open for a credential
  // column added later. This walks every column of every table and fails on
  // any name that reads like one, so adding it forces a decision rather than
  // quietly shipping it in a plain text backup.
  it("no table has a credential-looking column outside the denylist", () => {
    const suspicious = /token|secret|password|passwd|credential|apikey|api_key|private_?key/i;
    const offenders: string[] = [];
    for (const [tableName, table] of backupTables()) {
      for (const column of Object.keys(getTableColumns(table))) {
        if (suspicious.test(column) && !BACKUP_SECRET_COLUMNS.has(column)) {
          offenders.push(`${tableName}.${column}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

});

// ---------------------------------------------------------------------------
// Route wiring: both require auth; both delegate to the lib functions above.
// requireAuthApi's isAuthed() calls next/headers' cookies(), which throws
// outside a real request scope -- so these mock next/headers the same way
// tests/health.test.ts mocks "@/db", scoped to this describe block only.
// ---------------------------------------------------------------------------

function mockUnauthenticatedCookies() {
  vi.doMock("next/headers", () => ({
    cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
  }));
}

function mockAuthenticatedCookies(token: string) {
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) => (name === "fin_session" ? { value: token } : undefined),
      set: () => {},
      delete: () => {},
    }),
  }));
}

describe("export routes require auth", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.resetModules();
  });

  it("GET /api/export/transactions.csv returns 401 when not logged in", async () => {
    vi.resetModules();
    mockUnauthenticatedCookies();
    const { GET } = await import("@/app/api/export/transactions.csv/route");
    const res = await GET(new Request("http://localhost/api/export/transactions.csv"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("GET /api/export/backup.json returns 401 when not logged in", async () => {
    vi.resetModules();
    mockUnauthenticatedCookies();
    const { GET } = await import("@/app/api/export/backup.json/route");
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });
});

describe("export routes, authenticated", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.resetModules();
  });

  it("transactions.csv responds 200 with CSV headers and rows matching the shared query", async () => {
    const [item] = await db.insert(items).values({ plaidItemId: "item-export-route", accessTokenEnc: encrypt("tok") }).returning();
    const [account] = await db
      .insert(accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-export-route", name: "Checking", type: "depository" })
      .returning();
    await db.insert(transactions).values({
      accountId: account.id, plaidTransactionId: "tx-export-route", date: "2026-03-01", amount: "5.00", name: "Route Test",
    });

    vi.resetModules();
    mockAuthenticatedCookies(sessionToken());
    const { GET } = await import("@/app/api/export/transactions.csv/route");
    const res = await GET(new Request("http://localhost/api/export/transactions.csv"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("transactions.csv");
    const text = await res.text();
    expect(text).toContain("Route Test");
  });

  it("backup.json responds 200 with JSON that omits accessTokenEnc", async () => {
    await db.insert(items).values({ plaidItemId: "item-export-route-backup", accessTokenEnc: encrypt("tok") });

    vi.resetModules();
    mockAuthenticatedCookies(sessionToken());
    const { GET } = await import("@/app/api/export/backup.json/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toContain("accessTokenEnc");
  });
});
