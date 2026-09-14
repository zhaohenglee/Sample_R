import { requireAuthApi } from "@/lib/auth";
import { createManualTransaction, validateManualTransactionInput } from "@/lib/manual";
import { ValidationError } from "@/lib/categories";

// POST { accountId, date, description, amount, direction: "in" | "out", categoryId?, notes? }
// Creates one manual transaction. `accountId` must reference a manual
// account. `amount` is the positive magnitude the user entered; `direction`
// flips it to Plaid's sign convention (positive = money out) before storing.
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
    const input = validateManualTransactionInput(body);
    const row = await createManualTransaction(input);
    return Response.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
