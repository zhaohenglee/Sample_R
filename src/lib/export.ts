// T6.4: exporting the ledger. Two independent things live here:
//
// - transactionsToCsv turns the same rows the /transactions page shows into
//   an RFC 4180 CSV, so `GET /api/export/transactions.csv` (which shares
//   transactionListQuery with the page -- see src/lib/transactions.ts)
//   produces exactly the filtered page's rows, in the same order.
// - buildBackup dumps every table for `GET /api/export/backup.json`. It
//   selects an explicit column allowlist from `items` rather than
//   `db.select().from(items)`, so `access_token_enc` -- the encrypted Plaid
//   access token -- can never leave the database through this route, now or
//   after a future column is added to that table. tests/export.test.ts
//   asserts this against the whole serialized payload, not just the field
//   itself, so a renamed or relocated secret still trips the test.
import { db, schema } from "@/db";
import { signedAmount, accountLabel } from "./format";
import type { transactionListQuery } from "./transactions";

const { items, accounts, categories, transactions, budgets, categoryRules, balanceSnapshots, recurring, syncLog } = schema;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

// A field needs quoting exactly when it contains a comma, a double quote,
// or a line break -- the same three hazards src/lib/csv.ts's parser treats
// specially. Embedded quotes double up (RFC 4180); everything else passes
// through unescaped, matching what parseCsv expects back.
function csvField(raw: string | number | boolean | null | undefined): string {
  const s = raw === null || raw === undefined ? "" : String(raw);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields.map(csvField).join(",") + "\r\n";
}

const CSV_HEADER = ["Date", "Description", "Account", "Category", "Amount", "Notes", "Pending", "Source"];

export type ExportTransactionRow = Awaited<ReturnType<typeof transactionListQuery>>[number];

// Same label precedence the transactions page uses (TransactionRow.tsx):
// display name first, then merchant, then the raw name.
function csvDescription(r: { name: string; merchant: string | null; displayName: string | null }): string {
  return r.displayName ?? r.merchant ?? r.name;
}

// Renders the exact rows a caller passed in (already filtered and ordered
// by transactionListQuery) as a CSV string, header first. Amount is shown
// signed the same way the page displays it (money.ts's signedAmount:
// negative = money out), since this file is meant to be read by the person
// who requested it, not fed back into Plaid's own convention.
export function transactionsToCsv(rows: ExportTransactionRow[]): string {
  let out = csvRow(CSV_HEADER);
  for (const r of rows) {
    out += csvRow([
      r.date,
      csvDescription(r),
      accountLabel({ name: r.account, nickname: r.accountNickname }),
      r.categoryName ?? (r.categoryId ? "" : "Uncategorized"),
      signedAmount(r.amount),
      r.notes ?? "",
      r.pending ? "yes" : "no",
      r.source,
    ]);
  }
  return out;
}

// Wraps an already-built CSV string in a chunked ReadableStream so the
// route can stream the response body rather than handing the client one
// giant buffer -- the query itself still runs as a single statement (the
// personal-ledger row counts this app deals with make a DB-level cursor
// unnecessary complexity), but the HTTP response is genuinely chunked.
export function streamCsv(csv: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(csv);
  const CHUNK = 64 * 1024;
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + CHUNK, bytes.length);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    },
  });
}

// ---------------------------------------------------------------------------
// Full backup
// ---------------------------------------------------------------------------

export type BackupItemRow = Omit<typeof items.$inferSelect, "accessTokenEnc">;

export type BackupPayload = {
  exportedAt: string;
  items: BackupItemRow[];
  accounts: (typeof accounts.$inferSelect)[];
  categories: (typeof categories.$inferSelect)[];
  transactions: (typeof transactions.$inferSelect)[];
  budgets: (typeof budgets.$inferSelect)[];
  categoryRules: (typeof categoryRules.$inferSelect)[];
  balanceSnapshots: (typeof balanceSnapshots.$inferSelect)[];
  recurring: (typeof recurring.$inferSelect)[];
  syncLog: (typeof syncLog.$inferSelect)[];
};

// Dumps every table for an offline backup. `items` is selected through an
// explicit column allowlist -- deliberately not `db.select().from(items)`
// -- so `accessTokenEnc` (the encrypted Plaid access token) is never read
// out of the database in the first place, rather than read and then
// stripped. That is what keeps it out even if another column is added to
// `items` later: the allowlist has to be extended on purpose to include it.
export async function buildBackup(): Promise<BackupPayload> {
  const [itemRows, accountRows, categoryRows, transactionRows, budgetRows, ruleRows, snapshotRows, recurringRows, syncLogRows] =
    await Promise.all([
      db
        .select({
          id: items.id,
          plaidItemId: items.plaidItemId,
          institutionId: items.institutionId,
          institutionName: items.institutionName,
          cursor: items.cursor,
          status: items.status,
          lastError: items.lastError,
          lastSyncedAt: items.lastSyncedAt,
          createdAt: items.createdAt,
        })
        .from(items),
      db.select().from(accounts),
      db.select().from(categories),
      db.select().from(transactions),
      db.select().from(budgets),
      db.select().from(categoryRules),
      db.select().from(balanceSnapshots),
      db.select().from(recurring),
      db.select().from(syncLog),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    items: itemRows,
    accounts: accountRows,
    categories: categoryRows,
    transactions: transactionRows,
    budgets: budgetRows,
    categoryRules: ruleRows,
    balanceSnapshots: snapshotRows,
    recurring: recurringRows,
    syncLog: syncLogRows,
  };
}
