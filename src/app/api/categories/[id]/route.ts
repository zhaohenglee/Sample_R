import { requireAuthApi } from "@/lib/auth";
import {
  deleteCategory,
  updateCategory,
  validateCategoryInput,
  InvalidParentError,
  NameConflictError,
  PlaidPrimaryConflictError,
  ValidationError,
} from "@/lib/categories";

const ID_RE = /^\d{1,9}$/;

// PATCH { name?: string, parentId?: number | null, plaidPrimary?: string | null }
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
    const input = validateCategoryInput(body, { partial: true });
    const row = await updateCategory(Number(id), input);
    if (!row) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(row);
  } catch (e) {
    if (e instanceof PlaidPrimaryConflictError || e instanceof NameConflictError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof ValidationError || e instanceof InvalidParentError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

// DELETE: children move to top level, transactions.category_id is set null.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });
  const row = await deleteCategory(Number(id));
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(row);
}
