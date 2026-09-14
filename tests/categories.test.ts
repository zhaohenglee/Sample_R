import { describe, it, expect, beforeEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,
  validateCategoryInput,
  PlaidPrimaryConflictError,
  NameConflictError,
  InvalidParentError,
  ValidationError,
} from "@/lib/categories";
import { encrypt } from "@/lib/crypto";

describe("categories", () => {
  beforeEach(async () => {
    // tests/setup.ts truncates once per file (beforeAll); clear between
    // tests within this file so each case starts from an empty table.
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);
  });

  it("creates, renames, and reparents a category", async () => {
    const parent = await createCategory({ name: "Home" });
    const child = await createCategory({ name: "Rent", parentId: parent.id });
    expect(child.parentId).toBe(parent.id);

    const renamed = await updateCategory(child.id, { name: "Mortgage" });
    expect(renamed?.name).toBe("Mortgage");

    const reparented = await updateCategory(child.id, { parentId: null });
    expect(reparented?.parentId).toBeNull();
  });

  it("rejects two categories claiming the same plaid primary", async () => {
    await createCategory({ name: "Food", plaidPrimary: "FOOD_AND_DRINK" });
    await expect(createCategory({ name: "Dining", plaidPrimary: "FOOD_AND_DRINK" })).rejects.toBeInstanceOf(
      PlaidPrimaryConflictError,
    );
  });

  it("allows updating a category's own plaid primary without conflicting with itself", async () => {
    const cat = await createCategory({ name: "Food", plaidPrimary: "FOOD_AND_DRINK" });
    const updated = await updateCategory(cat.id, { plaidPrimary: "FOOD_AND_DRINK" });
    expect(updated?.plaidPrimary).toBe("FOOD_AND_DRINK");
  });

  it("rejects nesting more than one level deep", async () => {
    const grandparent = await createCategory({ name: "Home" });
    const parent = await createCategory({ name: "Utilities", parentId: grandparent.id });
    const other = await createCategory({ name: "Other" });
    // `other` cannot become a child of `parent`, since `parent` is itself a child.
    await expect(updateCategory(other.id, { parentId: parent.id })).rejects.toBeInstanceOf(InvalidParentError);
    // A category with children of its own cannot become a child.
    await expect(updateCategory(grandparent.id, { parentId: other.id })).rejects.toBeInstanceOf(InvalidParentError);
  });

  it("deleting a parent moves its children to top level", async () => {
    const parent = await createCategory({ name: "Home" });
    const child = await createCategory({ name: "Rent", parentId: parent.id });

    await deleteCategory(parent.id);

    const remaining = await listCategories();
    const child2 = remaining.find((c) => c.id === child.id);
    expect(child2?.parentId).toBeNull();
    expect(remaining.find((c) => c.id === parent.id)).toBeUndefined();
  });

  it("deleting a category sets category_id to null on its transactions", async () => {
    const category = await createCategory({ name: "Shopping" });
    const [item] = await db.insert(schema.items).values({ plaidItemId: "item-cat-test", accessTokenEnc: encrypt("tok") }).returning();
    const [account] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-cat-test", name: "Checking", type: "depository" })
      .returning();
    const [tx] = await db
      .insert(schema.transactions)
      .values({
        accountId: account.id,
        plaidTransactionId: "tx-cat-test",
        date: "2026-09-01",
        amount: "10.00",
        name: "Store",
        categoryId: category.id,
      })
      .returning();

    const deleted = await deleteCategory(category.id);
    expect(deleted?.id).toBe(category.id);

    const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
    expect(row.categoryId).toBeNull();
  });

  it("deleting a non-existent category returns null", async () => {
    const result = await deleteCategory(999999);
    expect(result).toBeNull();
  });

  it("rejects two categories claiming the same name", async () => {
    await createCategory({ name: "Food" });
    await expect(createCategory({ name: "Food" })).rejects.toBeInstanceOf(NameConflictError);
  });

  it("rejects a duplicate name on rename too", async () => {
    await createCategory({ name: "Food" });
    const other = await createCategory({ name: "Dining" });
    await expect(updateCategory(other.id, { name: "Food" })).rejects.toBeInstanceOf(NameConflictError);
  });

  it("validateCategoryInput rejects a non-integer/out-of-range parentId", () => {
    expect(() => validateCategoryInput({ name: "Food", parentId: "abc" }, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ name: "Food", parentId: 1.5 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ name: "Food", parentId: 9e99 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ name: "Food", parentId: {} }, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ name: "Food", parentId: -1 }, { partial: false })).toThrow(ValidationError);
  });

  it("validateCategoryInput rejects a name over 60 characters", () => {
    expect(() => validateCategoryInput({ name: "x".repeat(61) }, { partial: false })).toThrow(ValidationError);
    // exactly 60 is fine
    expect(validateCategoryInput({ name: "x".repeat(60) }, { partial: false }).name).toHaveLength(60);
  });

  it("validateCategoryInput rejects malformed bodies", () => {
    expect(() => validateCategoryInput(null, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput("nope", { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput([], { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({}, { partial: false })).toThrow(ValidationError); // name required when not partial
    expect(() => validateCategoryInput({ name: "Food", extra: 1 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ name: 5 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ plaidPrimary: 5 }, { partial: true })).toThrow(ValidationError);
    expect(() => validateCategoryInput({ plaidPrimary: "x".repeat(65) }, { partial: true })).toThrow(ValidationError);
    // partial update with no fields at all is fine (a no-op update)
    expect(validateCategoryInput({}, { partial: true })).toEqual({});
  });

  it("deleteCategory rolls back the category_id null-out when the delete itself fails", async () => {
    // A trigger that blocks deleting one specific category, so we can prove
    // deleteCategory's transaction rolls back its earlier writes when the
    // final DELETE fails, rather than leaving transactions half-updated.
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION _test_block_category_delete() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'blocked for test';
      END;
      $$ LANGUAGE plpgsql;
    `);
    await db.execute(sql`
      CREATE TRIGGER _test_block_category_delete_trigger
      BEFORE DELETE ON categories
      FOR EACH ROW WHEN (OLD.name = 'ForceRollbackTest')
      EXECUTE FUNCTION _test_block_category_delete();
    `);

    try {
      const category = await createCategory({ name: "ForceRollbackTest" });
      const [item] = await db.insert(schema.items).values({ plaidItemId: "item-rollback-test", accessTokenEnc: encrypt("tok") }).returning();
      const [account] = await db
        .insert(schema.accounts)
        .values({ itemId: item.id, plaidAccountId: "acc-rollback-test", name: "Checking", type: "depository" })
        .returning();
      const [tx] = await db
        .insert(schema.transactions)
        .values({
          accountId: account.id,
          plaidTransactionId: "tx-rollback-test",
          date: "2026-09-01",
          amount: "5.00",
          name: "Store",
          categoryId: category.id,
        })
        .returning();

      await expect(deleteCategory(category.id)).rejects.toThrow();

      // If the delete were not transactional, this row would already be null.
      const [row] = await db.select().from(schema.transactions).where(eq(schema.transactions.id, tx.id));
      expect(row.categoryId).toBe(category.id);

      const [cat] = await db.select().from(schema.categories).where(eq(schema.categories.id, category.id));
      expect(cat).toBeDefined();
    } finally {
      await db.execute(sql`DROP TRIGGER IF EXISTS _test_block_category_delete_trigger ON categories`);
      await db.execute(sql`DROP FUNCTION IF EXISTS _test_block_category_delete()`);
    }
  });
});
