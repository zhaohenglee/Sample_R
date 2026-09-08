import { eq } from "drizzle-orm";
import { requireAuthApi } from "@/lib/auth";
import { plaid, plaidProducts, plaidCountryCodes } from "@/lib/plaid";
import { decrypt } from "@/lib/crypto";
import { db, schema } from "@/db";

// POST { itemId?: number }  -> { link_token }
// With itemId, opens Link in update mode to fix ITEM_LOGIN_REQUIRED.
export async function POST(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  let accessToken: string | undefined;
  if (body?.itemId) {
    const [item] = await db.select().from(schema.items).where(eq(schema.items.id, Number(body.itemId)));
    if (item?.accessTokenEnc) accessToken = decrypt(item.accessTokenEnc);
  }

  const res = await plaid.linkTokenCreate({
    user: { client_user_id: "owner" },
    client_name: "Personal Finance",
    language: "en",
    country_codes: plaidCountryCodes,
    ...(accessToken ? { access_token: accessToken } : { products: plaidProducts }),
    transactions: { days_requested: 730 },
    ...(process.env.APP_URL?.startsWith("https") ? { webhook: `${process.env.APP_URL}/api/plaid/webhook` } : {}),
  });
  return Response.json({ link_token: res.data.link_token });
}
