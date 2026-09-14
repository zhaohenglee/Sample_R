// The import holds an account lock and, before the fix, asked the pool for
// a SECOND connection to load rules. With pool max 5, one import racing
// four manual writes on the same account hung forever: Postgres saw no
// cycle, so nothing timed out.
import { describe, it, expect, beforeEach } from "vitest";
import { db, schema } from "@/db";
import { commitImport } from "@/lib/import";
import { validateColumnMapping, parseCsv } from "@/lib/csv";
import { createManualAccount, createManualTransaction } from "@/lib/manual";
import { createRule } from "@/lib/rules";

const MAPPING = validateColumnMapping(
  { dateColumn: 0, dateFormat: "iso", descriptionColumn: 1, amountMode: "single", amountColumn: 2, signConvention: "expense_positive" }, 3);

describe("import does not exhaust the connection pool", () => {
  beforeEach(async () => {
    await db.delete(schema.balanceSnapshots);
    await db.delete(schema.categoryRules);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);
  });

  it("completes while manual writes contend for the same account", async () => {
    const account = await createManualAccount({ name: "Cash", type: "other", subtype: null, startingBalance: 0, currency: "USD" });
    const [category] = await db.insert(schema.categories).values({ name: "Coffee" }).returning();
    await createRule({ name: "Coffee", field: "name", match: "contains", pattern: "coffee", categoryId: category.id });

    const lines = ["date,description,amount"];
    for (let i = 0; i < 200; i++) lines.push(`2026-01-02,Coffee ${i},1.00`);

    await Promise.all([
      commitImport(account.id, MAPPING, parseCsv(lines.join("\n")).rows),
      ...Array.from({ length: 4 }, (_, i) =>
        createManualTransaction({
          accountId: account.id, date: "2026-02-0" + (i + 1), description: `manual ${i}`,
          amount: 1, direction: "out", categoryId: null, notes: null,
        })),
    ]);

    const rows = await db.select().from(schema.transactions);
    expect(rows).toHaveLength(204);
  }, 25000);
});
