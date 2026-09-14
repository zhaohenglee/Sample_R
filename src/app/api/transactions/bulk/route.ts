import { requireAuthApi } from "@/lib/auth";
import { bulkCategorize, validateBulkCategorizeInput } from "@/lib/transactions";
import { ValidationError } from "@/lib/categories";

// POST { ids: number[], categoryId: number | null }
// Bulk-sets category_id on up to 500 transactions in one request.
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
    const input = validateBulkCategorizeInput(body);
    const updated = await bulkCategorize(input);
    return Response.json({ updated });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
