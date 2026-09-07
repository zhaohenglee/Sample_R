import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt } from "./crypto";
import { plaid as defaultPlaidClient } from "./plaid";
import { ValidationError } from "./categories";

const { items, accounts } = schema;

export type AccountPatchInput = {
  nickname?: string | null;
  hidden?: boolean;
  excludeFromTotals?: boolean;
};

const PATCH_ALLOWED_FIELDS = new Set(["nickname", "hidden", "excludeFromTotals"]);
const MAX_NICKNAME_LEN = 60;

// Validates and normalizes a raw JSON PATCH body for a single account.
// Unknown top-level fields are rejected outright. A body that carries no
// recognized field (including `{}`) is rejected too -- there is nothing to
// update.
export function validateAccountPatch(body: unknown): Partial<AccountPatchInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!PATCH_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  const out: Partial<AccountPatchInput> = {};

  if ("nickname" in obj) {
    const raw = obj.nickname;
    if (raw === null) {
      out.nickname = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length < 1 || trimmed.length > MAX_NICKNAME_LEN) {
        throw new ValidationError(`nickname must be between 1 and ${MAX_NICKNAME_LEN} characters, or null.`);
      }
      out.nickname = trimmed;
    } else {
      throw new ValidationError("nickname must be a string or null.");
    }
  }

  if ("hidden" in obj) {
    const raw = obj.hidden;
    if (typeof raw !== "boolean") throw new ValidationError("hidden must be a boolean.");
    out.hidden = raw;
  }

  if ("excludeFromTotals" in obj) {
    const raw = obj.excludeFromTotals;
    if (typeof raw !== "boolean") throw new ValidationError("excludeFromTotals must be a boolean.");
    out.excludeFromTotals = raw;
  }

  if (Object.keys(out).length === 0) {
    throw new ValidationError("no fields to update.");
  }

  return out;
}

export type Account = typeof accounts.$inferSelect;

// Applies a validated patch to one account. Returns null if the account
// does not exist (route handler translates that to 404). Runs in one
// transaction with the row locked FOR UPDATE for the duration.
export async function updateAccount(id: number, input: Partial<AccountPatchInput>): Promise<Account | null> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(accounts).where(eq(accounts.id, id)).for("update");
    if (!existing) return null;

    const set: Partial<typeof accounts.$inferInsert> = { updatedAt: new Date() };
    if ("nickname" in input) set.nickname = input.nickname ?? null;
    if ("hidden" in input) set.hidden = input.hidden;
    if ("excludeFromTotals" in input) set.excludeFromTotals = input.excludeFromTotals;

    const [row] = await tx.update(accounts).set(set).where(eq(accounts.id, id)).returning();
    return row;
  });
}

// Thrown when Plaid's /item/remove call fails. Carries the Plaid error_code
// (when available) so the route handler can surface it. Nothing local is
// deleted when this is thrown.
export class PlaidRemoveError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string | null,
  ) {
    super(message);
    this.name = "PlaidRemoveError";
  }
}

// A minimal shape of the Plaid client we need, so tests can inject a fake
// without pulling in the real SDK.
export type PlaidRemoveClient = {
  itemRemove(args: { access_token: string }): Promise<unknown>;
};

// Loads and locks the item row, decrypts its access token, and calls
// Plaid's /item/remove. Only on success (or on Plaid reporting the item is
// already gone -- ITEM_NOT_FOUND) does it delete the item row locally
// (accounts and transactions cascade). Any other Plaid failure throws
// PlaidRemoveError and the transaction rolls back, leaving all local rows
// intact. `client` defaults to the real Plaid instance; tests pass a fake.
export async function unlinkItem(id: number, client: PlaidRemoveClient = defaultPlaidClient): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [item] = await tx.select().from(items).where(eq(items.id, id)).for("update");
    if (!item) return false;

    const accessToken = decrypt(item.accessTokenEnc);
    try {
      await client.itemRemove({ access_token: accessToken });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error_code?: string; error_message?: string } }; message?: string };
      const code = err.response?.data?.error_code ?? null;
      // The item is already gone at Plaid -- treat that as a successful
      // unlink rather than blocking the user from clearing it locally.
      if (code !== "ITEM_NOT_FOUND") {
        const message = err.response?.data?.error_message ?? err.message ?? String(e);
        throw new PlaidRemoveError(message, code);
      }
    }

    await tx.delete(items).where(eq(items.id, id));
    return true;
  });
}
