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
import { getTableColumns, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { db, schema } from "@/db";
import { signedAmount, accountLabel } from "./format";
import type { transactionListQuery } from "./transactions";


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

// The amount column is written the way the page displays it: negative for
// money out. That is the INVERSE of what /import assumes by default, so the
// header says so outright -- without it, exporting and re-importing without
// changing the sign dropdown silently turns every expense into income.
const CSV_HEADER = ["Date", "Description", "Account", "Category", "Amount (negative = money out)", "Notes", "Pending", "Source"];

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

export type BackupItemRow = Omit<typeof schema.items.$inferSelect, "accessTokenEnc">;

// Every table in the schema, keyed by its export name, plus a timestamp.
// Deliberately derived rather than listed: a hand written list is how the
// goals table went missing from backups the moment it was added.
export type BackupPayload = { exportedAt: string; [table: string]: string | unknown[] };

// Column names that must never leave the database, matched on any table.
// `accessTokenEnc` is the encrypted Plaid access token: the key to the
// user's bank. A backup is a plain readable file the user may email to
// themselves or drop in cloud storage, so the token is never selected in
// the first place rather than selected and then stripped.
//
// This is a denylist, which fails open for a secret column added later, so
// tests/export.test.ts independently walks every column of every table and
// fails on any name that looks like a credential. Adding one therefore
// forces a deliberate decision instead of quietly shipping it.
export const BACKUP_SECRET_COLUMNS = new Set(["accessTokenEnc"]);

// The schema's tables, keyed by their export name. Drizzle also exports
// non-table values, so filter by identity rather than by shape.
export function backupTables(): [string, PgTable][] {
  return Object.entries(schema)
    .filter(([, value]) => is(value, PgTable))
    .map(([name, value]) => [name, value as PgTable]);
}

// Dumps every table for an offline backup. The table list comes from the
// schema itself, so a table added later is included without anyone
// remembering to extend this function.
export async function buildBackup(): Promise<BackupPayload> {
  const tables = backupTables();
  const results = await Promise.all(
    tables.map(([, table]) => {
      const columns = Object.fromEntries(
        Object.entries(getTableColumns(table)).filter(([name]) => !BACKUP_SECRET_COLUMNS.has(name)),
      );
      return db.select(columns).from(table);
    }),
  );

  const payload: BackupPayload = { exportedAt: new Date().toISOString() };
  tables.forEach(([name], i) => {
    payload[name] = results[i];
  });
  return payload;
}
