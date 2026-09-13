import { requireAuthApi } from "@/lib/auth";
import { commitImport } from "@/lib/import";
import { importErrorResponse, parseImportBody } from "@/lib/import-request";

// POST { accountId, csv, mapping } -> imports the file into a manual
// account. Runs as one database transaction: either every fresh row lands
// (with the balance recomputed and rules applied) or nothing does.
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
    const { accountId, records, mapping } = parseImportBody(body);
    return Response.json(await commitImport(accountId, mapping, records));
  } catch (e) {
    const res = importErrorResponse(e);
    if (res) return res;
    throw e;
  }
}
