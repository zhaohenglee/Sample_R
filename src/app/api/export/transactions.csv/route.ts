import { requireAuthApi } from "@/lib/auth";
import { streamCsv, transactionsToCsv } from "@/lib/export";
import { transactionListQuery, type TransactionListParams } from "@/lib/transactions";

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

  const url = new URL(req.url);
  const params: TransactionListParams = {
    q: url.searchParams.get("q") ?? undefined,
    account: url.searchParams.get("account") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  };

  const rows = await transactionListQuery(params);
  const csv = transactionsToCsv(rows);

  return new Response(streamCsv(csv), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="transactions.csv"',
    },
  });
}
