import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  matchRule,
  validateRuleInput,
  InvalidReferenceError,
  ValidationError,
  type Rule,
} from "@/lib/rules";
import { createCategory } from "@/lib/categories";
import { encrypt } from "@/lib/crypto";

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 1,
    name: "Test rule",
    field: "name",
    match: "contains",
    pattern: "coffee",
    amountMin: null,
    amountMax: null,
    accountId: null,
    categoryId: 1,
    setDisplayName: null,
    priority: 100,
    enabled: true,
    createdAt: new Date(),
    ...overrides,
  } as Rule;
}

describe("matchRule", () => {
  it("matches contains, case insensitively", () => {
    const rule = makeRule({ field: "name", match: "contains", pattern: "COFFEE" });
    const tx = { name: "Local Coffee Shop", merchantName: null, amount: 5, accountId: 1 };
    expect(matchRule(rule, tx)).toBe(true);
    expect(matchRule(rule, { ...tx, name: "Local Tea Shop" })).toBe(false);
  });

  it("matches starts_with", () => {
    const rule = makeRule({ field: "name", match: "starts_with", pattern: "amazon" });
    expect(matchRule(rule, { name: "Amazon.com", merchantName: null, amount: 10, accountId: 1 })).toBe(true);
    expect(matchRule(rule, { name: "Not Amazon", merchantName: null, amount: 10, accountId: 1 })).toBe(false);
  });

  it("matches regex", () => {
    const rule = makeRule({ field: "name", match: "regex", pattern: "^AMZN.*MKTP$" });
    expect(matchRule(rule, { name: "AMZN Digital MKTP", merchantName: null, amount: 10, accountId: 1 })).toBe(true);
    expect(matchRule(rule, { name: "Something else", merchantName: null, amount: 10, accountId: 1 })).toBe(false);
  });

  it("matches regex case insensitively (lowercase pattern, uppercase value)", () => {
    const rule = makeRule({ field: "name", match: "regex", pattern: "coffee" });
    expect(matchRule(rule, { name: "LOCAL COFFEE SHOP", merchantName: null, amount: 5, accountId: 1 })).toBe(true);
  });

  it("does not hang on a pathological-looking regex within the length cap", () => {
    const rule = makeRule({ field: "name", match: "regex", pattern: ".*.*.*.*x" });
    const value = "a".repeat(300);
    const start = performance.now();
    const result = matchRule(rule, { name: value, merchantName: null, amount: 1, accountId: 1 });
    const elapsedMs = performance.now() - start;
    expect(result).toBe(false);
    expect(elapsedMs).toBeLessThan(200);
  });

  it("field 'any' matches name OR merchant_name", () => {
    const rule = makeRule({ field: "any", match: "contains", pattern: "netflix" });
    expect(matchRule(rule, { name: "NETFLIX.COM", merchantName: null, amount: 15, accountId: 1 })).toBe(true);
    expect(matchRule(rule, { name: "Streaming charge", merchantName: "Netflix", amount: 15, accountId: 1 })).toBe(true);
    expect(matchRule(rule, { name: "Streaming charge", merchantName: "Hulu", amount: 15, accountId: 1 })).toBe(false);
  });

  it("field 'merchant_name' ignores a null merchant name", () => {
    const rule = makeRule({ field: "merchant_name", match: "contains", pattern: "netflix" });
    expect(matchRule(rule, { name: "Netflix charge", merchantName: null, amount: 15, accountId: 1 })).toBe(false);
  });

  it("amount bounds are inclusive", () => {
    const rule = makeRule({ field: "name", match: "contains", pattern: "x", amountMin: "10.00" as unknown as string, amountMax: "20.00" as unknown as string });
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 10, accountId: 1 })).toBe(true);
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 20, accountId: 1 })).toBe(true);
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 9.99, accountId: 1 })).toBe(false);
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 20.01, accountId: 1 })).toBe(false);
  });

  it("scopes to a specific account when accountId is set", () => {
    const rule = makeRule({ field: "name", match: "contains", pattern: "x", accountId: 5 });
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 1, accountId: 5 })).toBe(true);
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 1, accountId: 6 })).toBe(false);
  });

  it("a disabled rule never matches", () => {
    const rule = makeRule({ field: "name", match: "contains", pattern: "x", enabled: false });
    expect(matchRule(rule, { name: "x", merchantName: null, amount: 1, accountId: 1 })).toBe(false);
  });

  function regexMatches(pattern: string, text: string): boolean {
    const rule = makeRule({ field: "name", match: "regex", pattern });
    return matchRule(rule, { name: text, merchantName: null, amount: 1, accountId: 1 });
  }

  it("[ab] matches 'A'", () => {
    expect(regexMatches("[ab]", "A")).toBe(true);
  });

  it("[^a] does not match 'A'", () => {
    expect(regexMatches("[^a]", "A")).toBe(false);
  });

  it("[A-z] matches '_' and '^' (same as native JS)", () => {
    expect(regexMatches("[A-z]", "_")).toBe(true);
    expect(regexMatches("[A-z]", "^")).toBe(true);
  });

  it("[^A-z] does not match '_'", () => {
    expect(regexMatches("[^A-z]", "_")).toBe(false);
  });

  it("a{1,2} does not match 'aaa' when fully anchored", () => {
    expect(regexMatches("^a{1,2}$", "aaa")).toBe(false);
    expect(regexMatches("^a{1,2}$", "aa")).toBe(true);
  });

  it("'\\.' matches a literal dot only", () => {
    expect(regexMatches("\\.", ".")).toBe(true);
    expect(regexMatches("\\.", "a")).toBe(false);
  });

  it("'\\s+' matches a tab", () => {
    expect(regexMatches("\\s+", "a\tb")).toBe(true);
  });

  it("'a.b' does not match 'a\\rb' (dot excludes \\r)", () => {
    expect(regexMatches("a.b", "a\rb")).toBe(false);
    expect(regexMatches("a.b", "axb")).toBe(true);
  });

  it("a legacy pattern with groups, inserted directly, never matches (fails closed)", () => {
    const rule = makeRule({ field: "name", match: "regex", pattern: "(abc)|(def)" });
    // If groups were (mis)interpreted as literal parentheses this would be
    // false anyway for this text, so also check text that native regex
    // WOULD match, to prove we are not just accidentally right.
    expect(matchRule(rule, { name: "abc", merchantName: null, amount: 1, accountId: 1 })).toBe(false);
    expect(matchRule(rule, { name: "(abc)", merchantName: null, amount: 1, accountId: 1 })).toBe(false);
  });
});

describe("validateRuleInput", () => {
  it("rejects an invalid regex pattern", () => {
    expect(() =>
      validateRuleInput(
        { name: "Bad", field: "name", match: "regex", pattern: "(unclosed", categoryId: 1 },
        { partial: false },
      ),
    ).toThrow(ValidationError);
  });

  it("rejects amountMin greater than amountMax", () => {
    expect(() =>
      validateRuleInput(
        { name: "Bad", field: "name", match: "contains", pattern: "x", categoryId: 1, amountMin: 50, amountMax: 10 },
        { partial: false },
      ),
    ).toThrow(ValidationError);
  });

  it("accepts amountMin equal to amountMax", () => {
    const input = validateRuleInput(
      { name: "Ok", field: "name", match: "contains", pattern: "x", categoryId: 1, amountMin: 10, amountMax: 10 },
      { partial: false },
    );
    expect(input.amountMin).toBe(10);
    expect(input.amountMax).toBe(10);
  });

  it("rejects unknown field values", () => {
    expect(() =>
      validateRuleInput({ name: "Bad", field: "bogus", match: "contains", pattern: "x", categoryId: 1 }, { partial: false }),
    ).toThrow(ValidationError);
    expect(() =>
      validateRuleInput({ name: "Bad", field: "name", match: "bogus", pattern: "x", categoryId: 1 }, { partial: false }),
    ).toThrow(ValidationError);
  });

  it("rejects a pattern over 200 characters", () => {
    expect(() =>
      validateRuleInput(
        { name: "Bad", field: "name", match: "contains", pattern: "x".repeat(201), categoryId: 1 },
        { partial: false },
      ),
    ).toThrow(ValidationError);
  });

  describe("restricted regex dialect", () => {
    const rejected = [
      "(a+)+$",
      "(?:ab)+",
      "(?=a)",
      "\\1",
      "a**",
      "a{2}{3}",
      ".*.*.*.*.*x", // 5 quantifiers
      "\\bab", // \b is a rejected letter-escape, not one of \d \w \s
      "\\n", // rejected letter-escape (control-char shorthand, not \d \w \s)
    ];
    for (const pattern of rejected) {
      it(`rejects ${JSON.stringify(pattern)}`, () => {
        expect(() =>
          validateRuleInput({ name: "Bad", field: "name", match: "regex", pattern, categoryId: 1 }, { partial: false }),
        ).toThrow(ValidationError);
      });
    }

    const accepted = ["^AMZN.*MKTP$", "^[A-Z]{2,4}\\d+$", "coffee|tea", "a*?b", "\\.", "\\s+"];
    for (const pattern of accepted) {
      it(`accepts ${JSON.stringify(pattern)}`, () => {
        const input = validateRuleInput(
          { name: "Ok", field: "name", match: "regex", pattern, categoryId: 1 },
          { partial: false },
        );
        expect(input.pattern).toBe(pattern);
      });
    }
  });

  it("rejects an amountMin/amountMax that is not finite or too large in magnitude", () => {
    expect(() =>
      validateRuleInput(
        { name: "Bad", field: "name", match: "contains", pattern: "x", categoryId: 1, amountMin: Infinity },
        { partial: false },
      ),
    ).toThrow(ValidationError);
    expect(() =>
      validateRuleInput(
        { name: "Bad", field: "name", match: "contains", pattern: "x", categoryId: 1, amountMax: 1e12 },
        { partial: false },
      ),
    ).toThrow(ValidationError);
    expect(() =>
      validateRuleInput(
        { name: "Bad", field: "name", match: "contains", pattern: "x", categoryId: 1, amountMin: NaN },
        { partial: false },
      ),
    ).toThrow(ValidationError);
  });

  it("rejects a NUL byte in name, pattern, or setDisplayName", () => {
    expect(() =>
      validateRuleInput(
        { name: "Bad Name", field: "name", match: "contains", pattern: "x", categoryId: 1 },
        { partial: false },
      ),
    ).toThrow(ValidationError);
    expect(() =>
      validateRuleInput(
        { name: "Ok", field: "name", match: "contains", pattern: "x ", categoryId: 1 },
        { partial: false },
      ),
    ).toThrow(ValidationError);
    expect(() =>
      validateRuleInput(
        { name: "Ok", field: "name", match: "contains", pattern: "x", categoryId: 1, setDisplayName: "bad " },
        { partial: false },
      ),
    ).toThrow(ValidationError);
  });

  it("rejects unknown top-level fields and malformed bodies", () => {
    expect(() => validateRuleInput(null, { partial: false })).toThrow(ValidationError);
    expect(() =>
      validateRuleInput({ name: "x", field: "name", match: "contains", pattern: "x", categoryId: 1, extra: 1 }, { partial: false }),
    ).toThrow(ValidationError);
  });

  it("requires all core fields on create but not on partial update", () => {
    expect(() => validateRuleInput({}, { partial: false })).toThrow(ValidationError);
    expect(validateRuleInput({}, { partial: true })).toEqual({});
  });
});

describe("rules storage", () => {
  let categoryId: number;
  let accountId: number;

  beforeEach(async () => {
    await db.delete(schema.categoryRules);
    await db.delete(schema.transactions);
    await db.delete(schema.accounts);
    await db.delete(schema.items);
    await db.delete(schema.categories);

    const category = await createCategory({ name: "Food & Drink" });
    categoryId = category.id;

    const [item] = await db.insert(schema.items).values({ plaidItemId: "item-rules-test", accessTokenEnc: encrypt("tok") }).returning();
    const [account] = await db
      .insert(schema.accounts)
      .values({ itemId: item.id, plaidAccountId: "acc-rules-test", name: "Checking", type: "depository" })
      .returning();
    accountId = account.id;
  });

  it("creates a rule", async () => {
    const rule = await createRule({
      name: "Coffee",
      field: "name",
      match: "contains",
      pattern: "coffee",
      categoryId,
    });
    expect(rule.id).toBeDefined();
    expect(rule.priority).toBe(100);
    expect(rule.enabled).toBe(true);
  });

  it("rejects creating a rule with a non-existent category", async () => {
    await expect(
      createRule({ name: "Bad", field: "name", match: "contains", pattern: "x", categoryId: 999999 }),
    ).rejects.toBeInstanceOf(InvalidReferenceError);
  });

  it("rejects creating a rule with a non-existent account", async () => {
    await expect(
      createRule({ name: "Bad", field: "name", match: "contains", pattern: "x", categoryId, accountId: 999999 }),
    ).rejects.toBeInstanceOf(InvalidReferenceError);
  });

  it("updates a rule", async () => {
    const rule = await createRule({ name: "Coffee", field: "name", match: "contains", pattern: "coffee", categoryId });
    const updated = await updateRule(rule.id, { priority: 5, enabled: false });
    expect(updated?.priority).toBe(5);
    expect(updated?.enabled).toBe(false);
  });

  it("updating with a bad category id is rejected and does not change the row", async () => {
    const rule = await createRule({ name: "Coffee", field: "name", match: "contains", pattern: "coffee", categoryId });
    await expect(updateRule(rule.id, { categoryId: 999999 })).rejects.toBeInstanceOf(InvalidReferenceError);
    const [row] = await db.select().from(schema.categoryRules).where(eq(schema.categoryRules.id, rule.id));
    expect(row.categoryId).toBe(categoryId);
  });

  it("updating a non-existent rule returns null", async () => {
    const result = await updateRule(999999, { priority: 1 });
    expect(result).toBeNull();
  });

  it("deletes a rule", async () => {
    const rule = await createRule({ name: "Coffee", field: "name", match: "contains", pattern: "coffee", categoryId });
    const deleted = await deleteRule(rule.id);
    expect(deleted?.id).toBe(rule.id);
    const remaining = await listRules();
    expect(remaining.find((r) => r.id === rule.id)).toBeUndefined();
  });

  it("deleting a non-existent rule returns null", async () => {
    const result = await deleteRule(999999);
    expect(result).toBeNull();
  });

  it("lists rules ordered by priority then id", async () => {
    const r1 = await createRule({ name: "A", field: "name", match: "contains", pattern: "a", categoryId, priority: 50 });
    const r2 = await createRule({ name: "B", field: "name", match: "contains", pattern: "b", categoryId, priority: 10 });
    const r3 = await createRule({ name: "C", field: "name", match: "contains", pattern: "c", categoryId, priority: 10 });
    const rows = await listRules();
    expect(rows.map((r) => r.id)).toEqual([r2.id, r3.id, r1.id]);
  });

  it("deleting a category cascades to delete its rules", async () => {
    const rule = await createRule({ name: "Coffee", field: "name", match: "contains", pattern: "coffee", categoryId });
    await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
    const remaining = await listRules();
    expect(remaining.find((r) => r.id === rule.id)).toBeUndefined();
  });

  it("deleting an account sets account_id to null on its rules", async () => {
    const rule = await createRule({
      name: "Coffee",
      field: "name",
      match: "contains",
      pattern: "coffee",
      categoryId,
      accountId,
    });
    await db.delete(schema.accounts).where(eq(schema.accounts.id, accountId));
    const [row] = await db.select().from(schema.categoryRules).where(eq(schema.categoryRules.id, rule.id));
    expect(row.accountId).toBeNull();
  });
});
