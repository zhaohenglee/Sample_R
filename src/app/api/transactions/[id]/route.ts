import { requireAuthApi } from "@/lib/auth";
import { updateTransaction, validateTransactionPatch } from "@/lib/transactions";
import { deleteManualTransaction } from "@/lib/manual";
import { ValidationError } from "@/lib/categories";

const ID_RE = /^\d{1,9}$/;

// PATCH { displayName?: string | null, categoryId?: number | null, notes?: string | null }
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
    const input = validateTransactionPatch(body);
    const row = await updateTransaction(Number(id), input);
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}

// DELETE: manual (and other non-Plaid) transactions only. A Plaid
// transaction returns 400 rather than being deleted -- sync would just
// recreate it on the next pass anyway, and only its category/notes/display
// name are ever user-owned.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });

  try {
    const row = await deleteManualTransaction(Number(id));
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
