import { requireAuthApi } from "@/lib/auth";
import { previewImport } from "@/lib/import";
import { importErrorResponse, parseImportBody } from "@/lib/import-request";
import { previewRows } from "@/lib/csv";

// POST { accountId, csv, mapping } -> a dry run: what a commit would do,
// plus a 10 row parsed preview. Writes nothing.
export async function POST(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const { accountId, records, headers, mapping } = parseImportBody(body);
    const result = await previewImport(accountId, mapping, records);
    return Response.json({ ...result, headers, totalRows: records.length, preview: previewRows(records, mapping) });
  } catch (e) {
    const res = importErrorResponse(e);
    if (res) return res;
    throw e;
  }
}
