// CSV import: turns a mapped file into transactions on a manual account.
//
// The whole import runs inside one db.transaction, so a failure part way
// through leaves nothing behind -- no half-imported file, no balance that
// reflects rows that were rolled back.
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "./categories";
import { recomputeManualBalance } from "./manual";
import { applyRulesToTransactions } from "./rules";
import { dedupeHash, mapRows, type ColumnMapping, type CsvRecord, type RowError } from "./csv";

const { accounts, transactions } = schema;

// Rows per INSERT statement. Each row binds 8 parameters and the protocol
// caps a statement at 65535, so 1000 rows (8000 parameters) leaves ample
// headroom if the row shape grows.
const INSERT_CHUNK_ROWS = 1000;

export type ImportResult = {
  imported: number;
  skippedDuplicates: number;
  errors: RowError[];
  categorized: number;
};

// A dry run of the same pipeline: reports what a commit would do without
// writing. Duplicate detection reads committed state, so the counts are
// exact as of the moment the preview was taken.
export async function previewImport(accountId: number, mapping: ColumnMapping, records: CsvRecord[]): Promise<ImportResult> {
  const account = await loadManualAccount(db, accountId);
  const { valid, errors } = mapRows(records, mapping);
  const existing = await existingHashes(db, account.id);
  const { fresh, duplicates } = splitDuplicates(valid, existing);
  return { imported: fresh.length, skippedDuplicates: duplicates, errors, categorized: 0 };
}

export async function commitImport(accountId: number, mapping: ColumnMapping, records: CsvRecord[]): Promise<ImportResult> {
  const { valid, errors } = mapRows(records, mapping);

  return db.transaction(async (tx) => {
    // Lock order across the app is transaction, then account, then
    // category. This path takes no transaction-row lock (every row it
    // touches is one it just inserted), so the account lock comes first
    // and recomputeManualBalance below re-acquires it harmlessly.
    const account = await loadManualAccount(tx, accountId, { lock: true });

    const existing = await existingHashes(tx, account.id);
    const { fresh, duplicates } = splitDuplicates(valid, existing);

    let insertedIds: number[] = [];
    if (fresh.length > 0) {
      const rows = fresh.map(({ row, hash }) => ({
        accountId: account.id,
        // `csv:` keeps imported ids disjoint from Plaid's and from the
        // `manual:` namespace. The sync path's guarantee that it never
        // writes a non-Plaid row rests on that disjointness, so this
        // prefix is load-bearing, not cosmetic.
        plaidTransactionId: `csv:${randomUUID()}`,
        date: row.date,
        amount: row.amount.toFixed(2),
        currency: account.currency ?? "USD",
        name: row.description,
        source: "csv",
        importHash: hash,
      }));
      // One statement per chunk. postgres.js binds every column of every
      // row as a parameter and the wire protocol caps those at 65535, so a
      // single statement covering the whole 10000 row allowance would
      // overflow it and fail mid-import. Chunking keeps each statement well
      // under the cap; all chunks share this transaction, so the import is
      // still all or nothing.
      for (let i = 0; i < rows.length; i += INSERT_CHUNK_ROWS) {
        const chunk = rows.slice(i, i + INSERT_CHUNK_ROWS);
        const inserted = await tx.insert(transactions).values(chunk).returning({ id: transactions.id });
        insertedIds.push(...inserted.map((r) => r.id));
      }
    }

    // Once for the batch, not per row: the balance is derived from the
    // whole ledger, so recomputing per row would be N redundant sums.
    await recomputeManualBalance(tx, account.id);

    // Join this transaction rather than opening a nested one, so rules
    // either land with the import or roll back with it.
    const applied = insertedIds.length > 0 ? await applyRulesToTransactions(insertedIds, {}, tx) : { changed: 0 };

    return {
      imported: insertedIds.length,
      skippedDuplicates: duplicates,
      errors,
      categorized: applied.changed,
    };
  });
}

type Queryable = Pick<typeof db, "select">;

async function loadManualAccount(runner: Queryable, accountId: number, opts: { lock?: boolean } = {}) {
  const base = runner.select().from(accounts).where(eq(accounts.id, accountId));
  const [account] = await (opts.lock ? base.for("update") : base);
  if (!account) throw new ValidationError(`Account ${accountId} does not exist.`);
  if (account.source !== "manual") {
    throw new ValidationError("CSV rows can only be imported into a manual account.");
  }
  return account;
}

async function existingHashes(runner: Queryable, accountId: number): Promise<Set<string>> {
  const rows = await runner
    .select({ hash: transactions.importHash })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), isNotNull(transactions.importHash)));
  return new Set(rows.map((r) => r.hash!).filter(Boolean));
}

// Splits mapped rows into ones to insert and a count of duplicates. A row
// is a duplicate of something already in the account, or of an earlier row
// in this same file -- re-importing a file that itself contains the same
// charge twice must not turn one stored row into two.
function splitDuplicates(
  valid: { line: number; date: string; description: string; amount: number }[],
  existing: Set<string>,
): { fresh: { row: { line: number; date: string; description: string; amount: number }; hash: string }[]; duplicates: number } {
  const seen = new Set(existing);
  // How many times this exact (date, amount, description) triple has been
  // seen so far in this file. Two identical rows are two real transactions,
  // so the second gets occurrence 1 and hashes distinctly instead of being
  // written off as a duplicate of the first.
  const occurrences = new Map<string, number>();
  const fresh: { row: (typeof valid)[number]; hash: string }[] = [];
  let duplicates = 0;
  for (const row of valid) {
    const triple = `${row.date}|${row.amount.toFixed(2)}|${row.description.trim().toLowerCase()}`;
    const occurrence = occurrences.get(triple) ?? 0;
    occurrences.set(triple, occurrence + 1);
    const hash = dedupeHash(row.date, row.amount, row.description, occurrence);
    if (seen.has(hash)) {
      duplicates += 1;
      continue;
    }
    seen.add(hash);
    fresh.push({ row, hash });
  }
  return { fresh, duplicates };
}
