// Integration tests for the CSV import pipeline.
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "@/lib/categories";
import { commitImport, previewImport } from "@/lib/import";
import { validateColumnMapping, parseCsv } from "@/lib/csv";
import { createManualAccount } from "@/lib/manual";
import { createRule } from "@/lib/rules";
import { markRemoved, upsertAccounts } from "@/lib/sync";

const { accounts, transactions, items, categories, categoryRules, balanceSnapshots } = schema;

const MAPPING = validateColumnMapping(
  { dateColumn: 0, dateFormat: "iso", descriptionColumn: 1, amountMode: "single", amountColumn: 2, signConvention: "expense_positive" },
  3,
);

const FILE = [
  "date,description,amount",
  "2026-01-02,Coffee Shop,4.50",
  "2026-01-03,Rent,900.00",
  "2026-01-04,Salary,-2000.00",
].join("\n");

function records(text: string) {
  return parseCsv(text).rows;
}

async function seedAccount(startingBalance = 0) {
  return createManualAccount({ name: "Cash Wallet", type: "other", subtype: null, startingBalance, currency: "USD" });
}

async function rowsFor(accountId: number) {
  return db.select().from(transactions).where(eq(transactions.accountId, accountId));
}

describe("CSV import", () => {
  beforeEach(async () => {
    await db.delete(balanceSnapshots);
    await db.delete(categoryRules);
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(items);
    await db.delete(categories);
  });

  it("imports rows with the csv source and a namespaced id", async () => {
    const account = await seedAccount();
    const result = await commitImport(account.id, MAPPING, records(FILE));
    expect(result.imported).toBe(3);
    expect(result.errors).toEqual([]);

    const rows = await rowsFor(account.id);
    expect(rows).toHaveLength(3);
    for (const r of rows) {
      expect(r.source).toBe("csv");
      // Load-bearing: sync's "never writes a non-Plaid row" guarantee rests
      // on imported ids being disjoint from Plaid's and from manual:.
      expect(r.plaidTransactionId.startsWith("csv:")).toBe(true);
      expect(r.importHash).toBeTruthy();
    }
  });

  it("keeps the sign convention: positive is money out", async () => {
    const account = await seedAccount();
    await commitImport(account.id, MAPPING, records(FILE));
    const rows = await rowsFor(account.id);
    expect(rows.find((r) => r.name === "Rent")!.amount).toBe("900.00");
    expect(rows.find((r) => r.name === "Salary")!.amount).toBe("-2000.00");
  });

  it("re-importing the same file inserts nothing", async () => {
    const account = await seedAccount();
    const first = await commitImport(account.id, MAPPING, records(FILE));
    expect(first.imported).toBe(3);

    const second = await commitImport(account.id, MAPPING, records(FILE));
    expect(second.imported).toBe(0);
    expect(second.skippedDuplicates).toBe(3);
    expect(await rowsFor(account.id)).toHaveLength(3);
  });

  it("dedupes a row repeated inside one file", async () => {
    const account = await seedAccount();
    const doubled = FILE + "\n2026-01-02,Coffee Shop,4.50";
    const result = await commitImport(account.id, MAPPING, records(doubled));
    expect(result.imported).toBe(3);
    expect(result.skippedDuplicates).toBe(1);
  });

  it("treats the same charge in two accounts as distinct", async () => {
    const a = await seedAccount();
    const b = await createManualAccount({ name: "Second", type: "other", subtype: null, startingBalance: 0, currency: "USD" });
    await commitImport(a.id, MAPPING, records(FILE));
    const result = await commitImport(b.id, MAPPING, records(FILE));
    expect(result.imported).toBe(3);
  });

  it("recomputes the account balance once the batch lands", async () => {
    const account = await seedAccount(1000);
    await commitImport(account.id, MAPPING, records(FILE));
    // 1000 - (4.50 + 900 - 2000) = 2095.50
    const [row] = await db.select().from(accounts).where(eq(accounts.id, account.id));
    expect(row.currentBalance).toBe("2095.50");
  });

  it("applies category rules to imported rows", async () => {
    const account = await seedAccount();
    const [category] = await db.insert(categories).values({ name: "Coffee" }).returning();
    await createRule({ name: "Coffee", field: "name", match: "contains", pattern: "coffee", categoryId: category.id });

    const result = await commitImport(account.id, MAPPING, records(FILE));
    expect(result.categorized).toBe(1);
    const rows = await rowsFor(account.id);
    expect(rows.find((r) => r.name === "Coffee Shop")!.categoryId).toBe(category.id);
    expect(rows.find((r) => r.name === "Rent")!.categoryId).toBeNull();
  });

  it("reports malformed rows by line without aborting the import", async () => {
    const account = await seedAccount();
    const messy = ["date,description,amount", "2026-01-02,Good,1.00", "nope,Bad,2.00", "2026-01-04,Fine,3.00"].join("\n");
    const result = await commitImport(account.id, MAPPING, records(messy));
    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(3);
  });

  it("refuses to import into a Plaid account and writes nothing", async () => {
    const [item] = await db.insert(items).values({ plaidItemId: "item-1", accessTokenEnc: "enc" }).returning();
    await upsertAccounts(item.id, [{
      account_id: "plaid-acc-1", name: "Checking", official_name: null, mask: "1111", type: "depository", subtype: "checking",
      balances: { current: 500, available: 500, iso_currency_code: "USD", limit: null, unofficial_currency_code: null },
    } as never]);
    const [plaidAccount] = await db.select().from(accounts).where(eq(accounts.plaidAccountId, "plaid-acc-1"));

    await expect(commitImport(plaidAccount.id, MAPPING, records(FILE))).rejects.toThrow(ValidationError);
    expect(await rowsFor(plaidAccount.id)).toHaveLength(0);
  });

  it("previewImport writes nothing", async () => {
    const account = await seedAccount();
    const result = await previewImport(account.id, MAPPING, records(FILE));
    expect(result.imported).toBe(3);
    expect(await rowsFor(account.id)).toHaveLength(0);
  });

  it("a sync pass leaves imported rows untouched", async () => {
    const account = await seedAccount();
    await commitImport(account.id, MAPPING, records(FILE));
    const before = await rowsFor(account.id);

    // markRemoved is the sync step that deletes by id. Feed it the exact
    // ids of the imported rows: the source filter must keep them alive.
    await markRemoved(before.map((r) => ({ transaction_id: r.plaidTransactionId })) as never);

    const after = await rowsFor(account.id);
    expect(after.every((r) => !r.isRemoved)).toBe(true);
    expect(after).toHaveLength(3);
  });
});
