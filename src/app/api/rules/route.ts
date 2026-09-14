import { requireAuthApi } from "@/lib/auth";
import {
  createRule,
  listRules,
  validateRuleInput,
  InvalidReferenceError,
  ValidationError,
} from "@/lib/rules";
import { isPgDataError } from "@/lib/pg-errors";

export async function GET() {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const rows = await listRules();
  return Response.json(rows);
}

// POST { name, field, match, pattern, amountMin?, amountMax?, accountId?,
//        categoryId, setDisplayName?, priority?, enabled? }
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
    const input = validateRuleInput(body, { partial: false });
    const row = await createRule(input);
    return Response.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError || e instanceof InvalidReferenceError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    if (isPgDataError(e)) {
      return Response.json({ error: "invalid value" }, { status: 400 });
    }
    throw e;
  }
}
