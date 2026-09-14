import { requireAuthApi } from "@/lib/auth";
import { createManualAccount, validateManualAccountInput } from "@/lib/manual";
import { ValidationError } from "@/lib/categories";

// POST { name, type, subtype?, startingBalance, currency? } -> creates a
// manual account (its own dedicated item shell, plus the account row).
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
    const input = validateManualAccountInput(body);
    const row = await createManualAccount(input);
    return Response.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
