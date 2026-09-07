import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "./categories";

const { transactions, categories } = schema;

export type TransactionPatchInput = {
  displayName?: string | null;
  categoryId?: number | null;
  notes?: string | null;
};

const PATCH_ALLOWED_FIELDS = new Set(["displayName", "categoryId", "notes"]);
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

    const [existing] = await tx.select({ id: transactions.id }).from(transactions).where(eq(transactions.id, id)).for("update");
    if (!existing) return null;

    const set: Partial<typeof transactions.$inferInsert> = { userEdited: true, updatedAt: new Date() };
    if ("displayName" in input) set.displayName = input.displayName ?? null;
    if ("categoryId" in input) set.categoryId = input.categoryId ?? null;
    if ("notes" in input) set.notes = input.notes ?? null;

    try {
      const [row] = await tx.update(transactions).set(set).where(eq(transactions.id, id)).returning();
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
export async function bulkCategorize(input: BulkCategorizeInput): Promise<number> {
  return db.transaction(async (tx) => {
    await assertCategoryExists(tx, input.categoryId);
    if (input.ids.length === 0) return 0;
    try {
      const rows = await tx
        .update(transactions)
        .set({ categoryId: input.categoryId, userEdited: true, updatedAt: new Date() })
        .where(inArray(transactions.id, input.ids))
        .returning({ id: transactions.id });
      return rows.length;
    } catch (e) {
      if (isForeignKeyViolation(e)) throw new ValidationError("category no longer exists");
      throw e;
    }
  });
}
