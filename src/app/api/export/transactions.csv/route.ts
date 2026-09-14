import { requireAuthApi } from "@/lib/auth";
import { streamCsv, transactionsToCsv } from "@/lib/export";
import { normalizeTransactionListParams, transactionListQuery, type RawListParams } from "@/lib/transactions";

// GET /api/export/transactions.csv?q=&account=&category=&from=&to=
//
// Accepts exactly the same query parameters as /transactions and shares its
// query (transactionListQuery, in src/lib/transactions.ts), so the exported
// rows match the filtered page exactly -- same filters, same order, same
// count -- with no separate filter implementation to drift out of sync.
// Unlike the page, every matching row is exported, not just one page of it.
export async function GET(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  // Shared with the page so the two cannot disagree about what a URL means,
  // and so a malformed filter is ignored rather than answering 500.
  const url = new URL(req.url);
  const raw: RawListParams = {};
  for (const key of ["q", "account", "category", "from", "to"]) {
    const values = url.searchParams.getAll(key);
    if (values.length > 0) raw[key] = values;
  }

  const rows = await transactionListQuery(normalizeTransactionListParams(raw));
  const csv = transactionsToCsv(rows);

  return new Response(streamCsv(csv), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="transactions.csv"',
    },
  });
}
