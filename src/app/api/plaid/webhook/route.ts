import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { syncItem } from "@/lib/sync";

// Plaid webhook receiver. Only reacts to transaction updates and item errors.
// TODO before production: verify the Plaid-Verification JWT header
// (https://plaid.com/docs/api/webhooks/webhook-verification/).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.item_id) return Response.json({ ok: true });

  const [item] = await db.select().from(schema.items).where(eq(schema.items.plaidItemId, body.item_id));
  if (!item) return Response.json({ ok: true });

  if (body.webhook_type === "TRANSACTIONS" && body.webhook_code === "SYNC_UPDATES_AVAILABLE") {
    await syncItem(item.id);
  } else if (body.webhook_type === "ITEM" && body.webhook_code === "ERROR") {
    const code = body.error?.error_code ?? "ERROR";
    await db.update(schema.items)
      .set({ status: code === "ITEM_LOGIN_REQUIRED" ? "login_required" : "error", lastError: code })
      .where(eq(schema.items.id, item.id));
  }
  return Response.json({ ok: true });
}
