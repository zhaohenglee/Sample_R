import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "./categories";
import {
  hasAtMostTwoDecimals,
  isValidCalendarDate,
  MAX_ABS_AMOUNT,
  MAX_DESCRIPTION_LEN,
  recomputeManualBalance,
  toPlaidSignedAmount,
} from "./manual";

const { transactions, categories } = schema;

export type TransactionPatchInput = {
  displayName?: string | null;
  categoryId?: number | null;
  notes?: string | null;
  // Non-Plaid rows only (source !== "plaid"): full edit. `amount` is the
  // positive magnitude the user entered; `direction` flips it to Plaid's
  // sign convention via the same toPlaidSignedAmount the create path uses.
  date?: string;
  amount?: number;
  direction?: "in" | "out";
  name?: string;
};

const PATCH_ALLOWED_FIELDS = new Set(["displayName", "categoryId", "notes", "date", "amount", "direction", "name"]);
// Fields only a non-Plaid (manual/csv) row may have PATCHed.
const NON_PLAID_ONLY_FIELDS = new Set(["date", "amount", "direction", "name"]);
const MAX_DISPLAY_NAME_LEN = 120;
const MAX_NOTES_LEN = 1000;
const MAX_PG_INT = 2147483647; // postgres integer column max
const MAX_BULK_IDS = 500;

function validateCategoryIdField(raw: unknown): number | null {
  if (raw === null) return null;
  if (typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT) return raw;
  throw new ValidationError("categoryId must be a positive integer or null.");
}

// Validates and normalizes a raw JSON PATCH body for a single transaction.
// Unknown top-level fields are rejected outright. A body that carries no
// recognized field (including `{}`) is rejected too -- there is nothing to
// update, and this must never end up marking the row user_edited.
export function validateTransactionPatch(body: unknown): Partial<TransactionPatchInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!PATCH_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  const out: Partial<TransactionPatchInput> = {};

  if ("displayName" in obj) {
    const raw = obj.displayName;
    if (raw === null) {
      out.displayName = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length < 1 || trimmed.length > MAX_DISPLAY_NAME_LEN) {
        throw new ValidationError(`displayName must be between 1 and ${MAX_DISPLAY_NAME_LEN} characters, or null.`);
      }
      out.displayName = trimmed;
    } else {
      throw new ValidationError("displayName must be a string or null.");
    }
  }

  if ("notes" in obj) {
    const raw = obj.notes;
    if (raw === null) {
      out.notes = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > MAX_NOTES_LEN) {
        throw new ValidationError(`notes must be at most ${MAX_NOTES_LEN} characters.`);
      }
      // Trimmed the same way displayName is: whitespace-only normalizes to null.
      out.notes = trimmed === "" ? null : trimmed;
    } else {
      throw new ValidationError("notes must be a string or null.");
    }
  }

  if ("categoryId" in obj) {
    out.categoryId = validateCategoryIdField(obj.categoryId);
  }

  if ("date" in obj) {
    if (typeof obj.date !== "string" || !isValidCalendarDate(obj.date)) {
      throw new ValidationError("date must be a valid YYYY-MM-DD date.");
    }
    out.date = obj.date;
  }

  if ("name" in obj) {
    if (typeof obj.name !== "string") throw new ValidationError("name must be a string.");
    const trimmed = obj.name.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_DESCRIPTION_LEN) {
      throw new ValidationError(`name must be between 1 and ${MAX_DESCRIPTION_LEN} characters.`);
    }
    out.name = trimmed;
  }

  // amount and direction are a pair: a bare magnitude is meaningless
  // without a direction to sign it, and vice versa.
  const hasAmount = "amount" in obj;
  const hasDirection = "direction" in obj;
  if (hasAmount !== hasDirection) {
    throw new ValidationError("amount and direction must be provided together.");
  }
  if (hasAmount) {
    if (typeof obj.amount !== "number" || !Number.isFinite(obj.amount) || obj.amount <= 0) {
      throw new ValidationError("amount must be a positive number.");
    }
    if (obj.amount > MAX_ABS_AMOUNT || !hasAtMostTwoDecimals(obj.amount)) {
      throw new ValidationError("amount must have at most 2 decimal places and be a reasonable amount.");
    }
    if (obj.direction !== "in" && obj.direction !== "out") {
      throw new ValidationError('direction must be "in" or "out".');
    }
    out.amount = obj.amount;
    out.direction = obj.direction;
  }

  if (Object.keys(out).length === 0) {
    throw new ValidationError("no fields to update.");
  }

  return out;
}

export type BulkCategorizeInput = { ids: number[]; categoryId: number | null };

const BULK_ALLOWED_FIELDS = new Set(["ids", "categoryId"]);

// Validates and normalizes a raw JSON body for POST /api/transactions/bulk.
// ids must be an array of 1 to 500 positive integers; duplicates are
// silently deduped rather than rejected.
export function validateBulkCategorizeInput(body: unknown): BulkCategorizeInput {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!BULK_ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  if (!("ids" in obj)) throw new ValidationError("ids is required.");
  const rawIds = obj.ids;
  if (!Array.isArray(rawIds) || rawIds.length < 1 || rawIds.length > MAX_BULK_IDS) {
    throw new ValidationError(`ids must be an array of 1 to ${MAX_BULK_IDS} positive integers.`);
  }
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const raw of rawIds) {
    if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw <= 0 || raw > MAX_PG_INT) {
      throw new ValidationError("ids must all be positive integers.");
    }
    if (!seen.has(raw)) {
      seen.add(raw);
      ids.push(raw);
    }
  }

  if (!("categoryId" in obj)) throw new ValidationError("categoryId is required.");
  const categoryId = validateCategoryIdField(obj.categoryId);

  return { ids, categoryId };
}

// Drizzle wraps the underlying `postgres` driver error in a DrizzleQueryError,
// with the original PostgresError (code, constraint_name, ...) as `.cause`.
// Mirrors the equivalent helper in categories.ts.
function pgError(e: unknown): { code?: string } | null {
  if (typeof e !== "object" || e === null) return null;
  const withCause = e as { cause?: unknown; code?: unknown };
  const candidate = withCause.code !== undefined ? withCause : (withCause.cause as { code?: unknown } | undefined);
  if (candidate && typeof candidate === "object" && "code" in candidate) return candidate as { code?: string };
  return null;
}

function isForeignKeyViolation(e: unknown): boolean {
  const err = pgError(e);
  return !!err && err.code === "23503";
}

// A minimal query-capable handle: either the module-level `db`, or a
// transaction passed down from updateTransaction/bulkCategorize so the
// existence check and the write happen atomically, with the category row
// locked for the duration.
type Queryable = Pick<typeof db, "select">;

async function assertCategoryExists(tx: Queryable, categoryId: number | null): Promise<void> {
  if (categoryId === null) return;
  const [row] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).for("update");
  if (!row) throw new ValidationError(`Category ${categoryId} does not exist.`);
}

export type Transaction = typeof transactions.$inferSelect;

// Applies a validated patch to one transaction. Any edit marks the row
// user_edited so sync never overwrites it again. Returns null if the
// transaction does not exist (route handler translates that to 404).
// Runs in one transaction: the transaction row and (if given) the target
// category are both locked FOR UPDATE before the write, so a concurrent
// category delete can't race between the existence check and the UPDATE --
// the 23503 catch below is a defensive fallback for that same race.
export async function updateTransaction(id: number, input: Partial<TransactionPatchInput>): Promise<Transaction | null> {
  return db.transaction(async (tx) => {
    if ("categoryId" in input) await assertCategoryExists(tx, input.categoryId ?? null);

    const [existing] = await tx.select().from(transactions).where(eq(transactions.id, id)).for("update");
    if (!existing) return null;

    // Plaid rows keep exactly the three original fields (displayName,
    // categoryId, notes): sync would just recreate date/amount/name on the
    // next pass anyway, so those are only ever user-owned on a non-Plaid
    // (manual/csv) row.
    if (existing.source === "plaid") {
      for (const field of NON_PLAID_ONLY_FIELDS) {
        if (field in input) {
          throw new ValidationError(`${field} can only be edited on a non-Plaid transaction.`);
        }
      }
    }

    const set: Partial<typeof transactions.$inferInsert> = { userEdited: true, updatedAt: new Date() };
    if ("displayName" in input) set.displayName = input.displayName ?? null;
    if ("categoryId" in input) {
      set.categoryId = input.categoryId ?? null;
      // A manual re-categorization overrides whatever a rule set: clear
      // rule_id so the "set by rule" badge stops claiming credit for a
      // category the user just chose themselves.
      set.ruleId = null;
    }
    if ("notes" in input) set.notes = input.notes ?? null;
    if ("date" in input) set.date = input.date;
    if ("name" in input) set.name = input.name;
    if ("amount" in input && "direction" in input) {
      set.amount = toPlaidSignedAmount(input.amount!, input.direction!).toFixed(2);
    }

    try {
      const [row] = await tx.update(transactions).set(set).where(eq(transactions.id, id)).returning();
      // A manual account's current_balance is derived from its ledger, so
      // any edit that could move that ledger (amount here) -- or leave it
      // unchanged, recomputeManualBalance is idempotent either way --
      // triggers a recompute. No-op for a Plaid account.
      if (existing.source !== "plaid") await recomputeManualBalance(tx, existing.accountId);
      return row;
    } catch (e) {
      if (isForeignKeyViolation(e)) throw new ValidationError("category no longer exists");
      throw e;
    }
  });
}

// Sets category_id (and user_edited) on up to 500 transactions in one
// statement, inside one transaction with the target category locked FOR
// UPDATE for the duration. Returns the number of rows actually updated.
// Also clears rule_id, same as updateTransaction: a manual bulk
// re-categorization overrides whatever rule (if any) previously set it.
export async function bulkCategorize(input: BulkCategorizeInput): Promise<number> {
  return db.transaction(async (tx) => {
    await assertCategoryExists(tx, input.categoryId);
    if (input.ids.length === 0) return 0;
    try {
      const rows = await tx
        .update(transactions)
        .set({ categoryId: input.categoryId, ruleId: null, userEdited: true, updatedAt: new Date() })
        .where(inArray(transactions.id, input.ids))
        .returning({ id: transactions.id });
      return rows.length;
    } catch (e) {
      if (isForeignKeyViolation(e)) throw new ValidationError("category no longer exists");
      throw e;
    }
  });
}
