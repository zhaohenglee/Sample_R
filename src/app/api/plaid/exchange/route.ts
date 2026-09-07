import { requireAuthApi } from "@/lib/auth";
import { plaid, plaidCountryCodes } from "@/lib/plaid";
import { encrypt } from "@/lib/crypto";
import { db, schema } from "@/db";
import { ensureDefaultCategories } from "@/lib/categories";
import { syncItem, upsertAccounts } from "@/lib/sync";

// POST { public_token, institution?: { institution_id, name } }
export async function POST(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  const { public_token, institution } = await req.json();
  if (!public_token) return Response.json({ error: "public_token required" }, { status: 400 });

  const ex = await plaid.itemPublicTokenExchange({ public_token });
  const accessToken = ex.data.access_token;

  let institutionName: string | null = institution?.name ?? null;
  const institutionId: string | null = institution?.institution_id ?? null;
  if (!institutionName && institutionId) {
    const inst = await plaid.institutionsGetById({ institution_id: institutionId, country_codes: plaidCountryCodes });
    institutionName = inst.data.institution.name;
  }

  await ensureDefaultCategories();
  const [item] = await db.insert(schema.items).values({
    plaidItemId: ex.data.item_id,
    institutionId,
    institutionName,
    accessTokenEnc: encrypt(accessToken),
  }).onConflictDoUpdate({
    target: schema.items.plaidItemId,
    set: { accessTokenEnc: encrypt(accessToken), status: "ok", lastError: null },
  }).returning();

  const acc = await plaid.accountsGet({ access_token: accessToken });
  await upsertAccounts(item.id, acc.data.accounts);

  // First sync may return nothing yet if Plaid is still pulling history.
  const result = await syncItem(item.id);
  return Response.json({ item_id: item.id, ...result });
}
