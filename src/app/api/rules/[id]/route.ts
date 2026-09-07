import { requireAuthApi } from "@/lib/auth";
import {
  deleteRule,
  updateRule,
  validateRuleInput,
  InvalidReferenceError,
  ValidationError,
} from "@/lib/rules";
import { isPgDataError } from "@/lib/pg-errors";

const ID_RE = /^\d{1,9}$/;

// PATCH { name?, field?, match?, pattern?, amountMin?, amountMax?,
//         accountId?, categoryId?, setDisplayName?, priority?, enabled? }
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const input = validateRuleInput(body, { partial: true });
    const row = await updateRule(Number(id), input);
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(row);
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

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  const row = await deleteRule(Number(id));
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(row);
}
