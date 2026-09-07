import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

// Plaid personal_finance_category primary values mapped to friendlier names.
export const DEFAULT_CATEGORIES: { name: string; plaidPrimary: string }[] = [
  { name: "Income", plaidPrimary: "INCOME" },
  { name: "Transfers In", plaidPrimary: "TRANSFER_IN" },
  { name: "Transfers Out", plaidPrimary: "TRANSFER_OUT" },
  { name: "Loan Payments", plaidPrimary: "LOAN_PAYMENTS" },
  { name: "Bank Fees", plaidPrimary: "BANK_FEES" },
  { name: "Entertainment", plaidPrimary: "ENTERTAINMENT" },
  { name: "Food & Drink", plaidPrimary: "FOOD_AND_DRINK" },
  { name: "Shopping", plaidPrimary: "GENERAL_MERCHANDISE" },
  { name: "Home", plaidPrimary: "HOME_IMPROVEMENT" },
  { name: "Medical", plaidPrimary: "MEDICAL" },
  { name: "Personal Care", plaidPrimary: "PERSONAL_CARE" },
  { name: "Services", plaidPrimary: "GENERAL_SERVICES" },
  { name: "Government & Nonprofit", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT" },
  { name: "Transportation", plaidPrimary: "TRANSPORTATION" },
  { name: "Travel", plaidPrimary: "TRAVEL" },
  { name: "Rent & Utilities", plaidPrimary: "RENT_AND_UTILITIES" },
  { name: "Other", plaidPrimary: "OTHER" },
];

export async function ensureDefaultCategories() {
  await db.insert(schema.categories).values(DEFAULT_CATEGORIES).onConflictDoNothing();
}

export type Category = typeof schema.categories.$inferSelect;

export type CategoryInput = {
  name: string;
  parentId?: number | null;
  plaidPrimary?: string | null;
};

// Thrown when a create/update would give two categories the same
// non-null plaid_primary mapping. Route handlers translate this to 409.
export class PlaidPrimaryConflictError extends Error {
  constructor(public readonly plaidPrimary: string) {
    super(`Another category already maps Plaid primary "${plaidPrimary}"`);
    this.name = "PlaidPrimaryConflictError";
  }
}

// Thrown when a create/update would give two categories the same name.
// Route handlers translate this to 409.
export class NameConflictError extends Error {
  constructor(public readonly categoryName: string) {
    super(`A category named "${categoryName}" already exists.`);
    this.name = "NameConflictError";
  }
}

// Thrown for a parent_id that would break the one-level-of-nesting rule,
// or that does not exist. Route handlers translate this to 400.
export class InvalidParentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParentError";
  }
}

// Thrown by validateCategoryInput and by the empty-name checks below for a
// malformed request body. Route handlers translate this to 400.
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const ALLOWED_FIELDS = new Set(["name", "parentId", "plaidPrimary"]);
const MAX_NAME_LEN = 60;
const MAX_PLAID_PRIMARY_LEN = 64;
const MAX_PG_INT = 2147483647; // postgres integer column max

// Validates and normalizes a raw JSON request body into a CategoryInput.
// `partial: false` (create) requires `name`; `partial: true` (update) makes
// every field optional, but any field present is still fully validated.
// Unknown top-level fields are rejected outright.
export function validateCategoryInput(body: unknown, opts: { partial: false }): CategoryInput;
export function validateCategoryInput(body: unknown, opts: { partial: true }): Partial<CategoryInput>;
export function validateCategoryInput(body: unknown, opts: { partial: boolean }): CategoryInput | Partial<CategoryInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  const out: Partial<CategoryInput> = {};

  if ("name" in obj) {
    const raw = obj.name;
    if (typeof raw !== "string") throw new ValidationError("name must be a string.");
    const name = raw.trim();
    if (name.length < 1 || name.length > MAX_NAME_LEN) {
      throw new ValidationError(`name must be between 1 and ${MAX_NAME_LEN} characters.`);
    }
    out.name = name;
  } else if (!opts.partial) {
    throw new ValidationError("name is required.");
  }

  if ("parentId" in obj) {
    const raw = obj.parentId;
    if (raw === null) {
      out.parentId = null;
    } else if (typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT) {
      out.parentId = raw;
    } else {
      throw new ValidationError("parentId must be a positive integer or null.");
    }
  }

  if ("plaidPrimary" in obj) {
    const raw = obj.plaidPrimary;
    if (raw === null) {
      out.plaidPrimary = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > MAX_PLAID_PRIMARY_LEN) {
        throw new ValidationError(`plaidPrimary must be at most ${MAX_PLAID_PRIMARY_LEN} characters.`);
      }
      out.plaidPrimary = trimmed || null;
    } else {
      throw new ValidationError("plaidPrimary must be a string or null.");
    }
  }

  return out;
}

// Drizzle wraps the underlying `postgres` driver error in a DrizzleQueryError,
// with the original PostgresError (code, constraint_name, ...) as `.cause`.
function pgError(e: unknown): { code?: string; constraint_name?: string } | null {
  if (typeof e !== "object" || e === null) return null;
  const withCause = e as { cause?: unknown; code?: unknown };
  const candidate = withCause.code !== undefined ? withCause : (withCause.cause as { code?: unknown } | undefined);
  if (candidate && typeof candidate === "object" && "code" in candidate) return candidate as { code?: string; constraint_name?: string };
  return null;
}

function isPlaidPrimaryViolation(e: unknown): boolean {
  const err = pgError(e);
  return !!err && err.code === "23505" && err.constraint_name === "categories_plaid_primary_idx";
}

function isNameViolation(e: unknown): boolean {
  const err = pgError(e);
  return !!err && err.code === "23505" && err.constraint_name === "categories_name_unique";
}

// A minimal query-capable handle: either the module-level `db`, or a
// transaction passed down from createCategory/updateCategory so all locking
// and follow-up writes happen atomically.
type Queryable = Pick<typeof db, "select">;

// A category may only be nested one level deep: a parent must itself be
// top-level, and a category that already has children cannot be made a
// child of another category. Locks the category itself (if it already
// exists) and the proposed parent FOR UPDATE so a concurrent request can't
// race this check (e.g. two categories reparenting under each other, or a
// parent gaining a child at the same moment it is made a child itself).
async function assertValidParent(tx: Queryable, id: number | null, parentId: number | null): Promise<void> {
  if (parentId === null) return;
  if (parentId === id) throw new InvalidParentError("A category cannot be its own parent.");
  if (id !== null) {
    const [self] = await tx.select().from(schema.categories).where(eq(schema.categories.id, id)).for("update");
    if (!self) throw new InvalidParentError(`Category ${id} does not exist.`);
  }
  const [parent] = await tx.select().from(schema.categories).where(eq(schema.categories.id, parentId)).for("update");
  if (!parent) throw new InvalidParentError(`Parent category ${parentId} does not exist.`);
  if (parent.parentId !== null) throw new InvalidParentError("Only one level of nesting is supported: the parent must be a top-level category.");
  if (id !== null) {
    const [child] = await tx.select().from(schema.categories).where(eq(schema.categories.parentId, id));
    if (child) throw new InvalidParentError("This category has its own children and cannot be nested under another category.");
  }
}

export async function listCategories(): Promise<Category[]> {
  return db.select().from(schema.categories).orderBy(schema.categories.name);
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const name = input.name.trim();
  if (!name) throw new ValidationError("Name is required.");
  const parentId = input.parentId ?? null;
  const plaidPrimary = input.plaidPrimary?.trim() || null;

  return db.transaction(async (tx) => {
    await assertValidParent(tx, null, parentId);
    try {
      const [row] = await tx.insert(schema.categories).values({ name, parentId, plaidPrimary }).returning();
      return row;
    } catch (e) {
      if (isPlaidPrimaryViolation(e)) throw new PlaidPrimaryConflictError(plaidPrimary!);
      if (isNameViolation(e)) throw new NameConflictError(name);
      throw e;
    }
  });
}

export async function updateCategory(id: number, input: Partial<CategoryInput>): Promise<Category | null> {
  const set: Partial<typeof schema.categories.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new ValidationError("Name is required.");
    set.name = name;
  }
  if (input.plaidPrimary !== undefined) {
    set.plaidPrimary = input.plaidPrimary?.trim() || null;
  }

  return db.transaction(async (tx) => {
    if (input.parentId !== undefined) {
      await assertValidParent(tx, id, input.parentId);
      set.parentId = input.parentId;
    }
    if (Object.keys(set).length === 0) {
      const [row] = await tx.select().from(schema.categories).where(eq(schema.categories.id, id));
      return row ?? null;
    }
    try {
      const [row] = await tx.update(schema.categories).set(set).where(eq(schema.categories.id, id)).returning();
      return row ?? null;
    } catch (e) {
      if (isPlaidPrimaryViolation(e)) throw new PlaidPrimaryConflictError(set.plaidPrimary!);
      if (isNameViolation(e)) throw new NameConflictError(set.name!);
      throw e;
    }
  });
}

// Deletes a category. Its children (if any) move to top level and any
// transactions pointing at it have category_id set to null. All three
// writes (and the initial lock) happen in one transaction so a crash or
// concurrent write can't leave transactions pointing at a deleted category.
export async function deleteCategory(id: number): Promise<Category | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(schema.categories).where(eq(schema.categories.id, id)).for("update");
    if (!row) return null;
    await tx.update(schema.categories).set({ parentId: null }).where(eq(schema.categories.parentId, id));
    await tx.update(schema.transactions).set({ categoryId: null }).where(eq(schema.transactions.categoryId, id));
    await tx.delete(schema.categories).where(eq(schema.categories.id, id));
    return row;
  });
}
