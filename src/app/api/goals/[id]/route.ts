import { requireAuthApi } from "@/lib/auth";
import { deleteGoal, updateGoal, validateGoalInput } from "@/lib/goals";
import { ValidationError } from "@/lib/categories";

const ID_RE = /^\d{1,9}$/;

// PATCH { name?, accountId?: number | null, targetAmount?, targetDate?: string | null, currentAmount? }
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
    const input = validateGoalInput(body, { partial: true });
    const row = await updateGoal(Number(id), input);
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}

// DELETE: removes the goal itself. Does not touch the linked account.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });

  const row = await deleteGoal(Number(id));
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
