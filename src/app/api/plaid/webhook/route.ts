import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { syncItem } from "@/lib/sync";
import { verifyPlaidWebhook } from "@/lib/webhook-verify";

// Plaid webhook receiver. Verifies the Plaid-Verification JWT before doing
// anything with the body (https://plaid.com/docs/api/webhooks/webhook-verification/).
// Responses stay 200 for both handled and ignored (but authentic) events so
// Plaid does not retry them; only a failed signature gets 401.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const verification = await verifyPlaidWebhook(rawBody, req.headers.get("plaid-verification"));
  if (!verification.ok) {
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: {
    item_id?: string;
    webhook_type?: string;
    webhook_code?: string;
    error?: { error_code?: string };
  } | null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }
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
  } else if (body.webhook_type === "ITEM" && body.webhook_code === "PENDING_EXPIRATION") {
    await db.update(schema.items)
      .set({ status: "pending_expiration" })
      .where(eq(schema.items.id, item.id));
  } else if (body.webhook_type === "ITEM" && body.webhook_code === "NEW_ACCOUNTS_AVAILABLE") {
    await db.update(schema.items)
      .set({ status: "new_accounts_available" })
      .where(eq(schema.items.id, item.id));
  } else if (body.webhook_type === "ITEM" && body.webhook_code === "USER_PERMISSION_REVOKED") {
    await db.update(schema.items)
      .set({ status: "revoked" })
      .where(eq(schema.items.id, item.id));
  }
  // Any other webhook_type/webhook_code is a known-but-unhandled or
  // unrecognized event: acknowledge it as ignored rather than retried.
  return Response.json({ ok: true });
}
