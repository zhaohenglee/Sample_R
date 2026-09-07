import { requireAuthApi } from "@/lib/auth";
import { PlaidRemoveError, unlinkItem } from "@/lib/accounts";

const ID_RE = /^\d{1,9}$/;

// DELETE: calls Plaid /item/remove first. Only on success is the item row
// (and its accounts/transactions, via cascade) deleted locally. A Plaid
// failure returns 502 and leaves local data untouched.
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return Response.json({ error: "invalid id" }, { status: 400 });

  try {
    const removed = await unlinkItem(Number(id));
    if (!removed) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof PlaidRemoveError) {
      return Response.json({ error: "Plaid rejected the unlink request", errorCode: e.errorCode }, { status: 502 });
    }
    throw e;
  }
}
