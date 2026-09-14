import { requireAuthApi } from "@/lib/auth";
import { updateAccount, validateAccountPatch } from "@/lib/accounts";
import { deleteManualAccount } from "@/lib/manual";
import { ValidationError } from "@/lib/categories";

const ID_RE = /^\d{1,9}$/;

// PATCH { nickname?: string | null, hidden?: boolean, excludeFromTotals?: boolean }
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
    const input = validateAccountPatch(body);
    const row = await updateAccount(Number(id), input);
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}

// DELETE: manual accounts only. Cascades the account's transactions (via
// its dedicated item shell). A Plaid account is removed only by unlinking
// its item (DELETE /api/items/[id]) -- this returns 400 for one.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });

  try {
    const row = await deleteManualAccount(Number(id));
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
