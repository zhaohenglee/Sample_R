// T6.5 goals. See docs/TASKS.md T6.5 and its accept criteria:
//  - requiredMonthlyContribution is a pure function, unit tested including a
//    past target date and an already-met goal (both below).
//  - Deleting a linked account nulls the goal's account_id (ON DELETE SET
//    NULL at the DB level) rather than deleting the goal.
//  - Progress is capped at 100% only for display; the underlying numbers
//    are never clamped.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "@/lib/categories";
import { createManualAccount, deleteManualAccount } from "@/lib/manual";
import { sessionToken } from "@/lib/auth";
import {
  validateGoalInput,
  createGoal,
  updateGoal,
  deleteGoal,
  goalsWithProgress,
  goalProgress,
  requiredMonthlyContribution,
} from "@/lib/goals";

const { items, accounts, goals } = schema;

beforeEach(async () => {
  // items cascades accounts (and goals.account_id is nulled by the FK, not
  // cascaded away -- see the ON DELETE SET NULL tests below).
  await db.delete(goals);
  await db.delete(items);
});

// ---------------------------------------------------------------------------
// requiredMonthlyContribution -- pure function, no DB, no clock read
// ---------------------------------------------------------------------------

describe("requiredMonthlyContribution", () => {
  it("treats a past target date as due in full this month, not Infinity/NaN/negative", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 1200,
      currentAmount: 0,
      targetDate: "2020-01-01", // years in the past relative to `today`
      today: "2026-09-14",
    });
    expect(result).toBe(1200);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).not.toBeNaN();
    expect(result as number).toBeGreaterThanOrEqual(0);
  });

  it("treats a target date within the current month the same way: due in full, this month", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 900,
      currentAmount: 300,
      targetDate: "2026-09-30",
      today: "2026-09-14",
    });
    expect(result).toBe(600);
  });

  it("returns 0 for an already-met goal", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 1200,
      currentAmount: 1200,
      targetDate: "2027-01-01",
      today: "2026-09-14",
    });
    expect(result).toBe(0);
  });

  it("returns null when there is no target date", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 1000,
      currentAmount: 200,
      targetDate: null,
      today: "2026-09-14",
    });
    expect(result).toBeNull();
  });

  it("returns 0, not a negative number, for an over-funded goal (negative remaining)", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 500,
      currentAmount: 700,
      targetDate: "2027-01-01",
      today: "2026-09-14",
    });
    expect(result).toBe(0);
  });

  it("returns 0 for a goal with remaining amount exactly zero", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 500,
      currentAmount: 500,
      targetDate: "2027-01-01",
      today: "2026-09-14",
    });
    expect(result).toBe(0);
  });

  it("divides evenly over several whole months out", () => {
    const result = requiredMonthlyContribution({
      targetAmount: 1200,
      currentAmount: 0,
      targetDate: "2027-03-14",
      today: "2026-09-14",
    });
    // (2027*12+3) - (2026*12+9) = 6 months
    expect(result).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// goalProgress -- pure function; percent/remaining must not be clamped
// ---------------------------------------------------------------------------

describe("goalProgress", () => {
  it("computes remaining and percent normally", () => {
    const p = goalProgress(1000, 500);
    expect(p.remaining).toBe(500);
    expect(p.percent).toBe(50);
  });

  it("does not clamp percent or remaining for an over-funded goal", () => {
    const p = goalProgress(1000, 1500);
    expect(p.percent).toBe(150); // NOT capped at 100 here -- only the display does that
    expect(p.remaining).toBe(-500); // true (negative) remaining, not clamped to 0
  });
});

// ---------------------------------------------------------------------------
// validateGoalInput
// ---------------------------------------------------------------------------

describe("validateGoalInput", () => {
  it("rejects an unknown field", () => {
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 100, nope: 1 }, { partial: false })).toThrow(
      ValidationError,
    );
  });

  it("requires name and targetAmount on create", () => {
    expect(() => validateGoalInput({ targetAmount: 100 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateGoalInput({ name: "Trip" }, { partial: false })).toThrow(ValidationError);
  });

  it("trims name and enforces its length bound", () => {
    const input = validateGoalInput({ name: "  Trip  ", targetAmount: 100 }, { partial: false });
    expect(input.name).toBe("Trip");
    expect(() => validateGoalInput({ name: "", targetAmount: 100 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateGoalInput({ name: "x".repeat(101), targetAmount: 100 }, { partial: false })).toThrow(
      ValidationError,
    );
  });

  it("defaults accountId to null and currentAmount to 0 on create when omitted", () => {
    const input = validateGoalInput({ name: "Trip", targetAmount: 100 }, { partial: false });
    expect(input.accountId).toBeNull();
    expect(input.currentAmount).toBe(0);
    expect(input.targetDate).toBeNull();
  });

  it("rejects a non-positive or over-limit targetAmount", () => {
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 0 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateGoalInput({ name: "Trip", targetAmount: -5 }, { partial: false })).toThrow(ValidationError);
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 1e12 }, { partial: false })).toThrow(ValidationError);
  });

  it("rejects a targetAmount with more than 2 decimal places", () => {
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 19.999 }, { partial: false })).toThrow(
      ValidationError,
    );
  });

  it("rejects a negative currentAmount", () => {
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 100, currentAmount: -1 }, { partial: false })).toThrow(
      ValidationError,
    );
  });

  it("accepts a null or positive-integer accountId, rejects anything else", () => {
    expect(validateGoalInput({ name: "Trip", targetAmount: 100, accountId: null }, { partial: false }).accountId).toBeNull();
    expect(validateGoalInput({ name: "Trip", targetAmount: 100, accountId: 3 }, { partial: false }).accountId).toBe(3);
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 100, accountId: 0 }, { partial: false })).toThrow(
      ValidationError,
    );
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 100, accountId: 1.5 }, { partial: false })).toThrow(
      ValidationError,
    );
  });

  it("accepts a null or valid YYYY-MM-DD targetDate, rejects garbage", () => {
    expect(
      validateGoalInput({ name: "Trip", targetAmount: 100, targetDate: "2026-12-31" }, { partial: false }).targetDate,
    ).toBe("2026-12-31");
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 100, targetDate: "2026-13-01" }, { partial: false })).toThrow(
      ValidationError,
    );
    expect(() => validateGoalInput({ name: "Trip", targetAmount: 100, targetDate: "not-a-date" }, { partial: false })).toThrow(
      ValidationError,
    );
  });

  it("partial mode makes every field optional but still validates what's present", () => {
    expect(validateGoalInput({}, { partial: true })).toEqual({});
    expect(() => validateGoalInput({ targetAmount: -1 }, { partial: true })).toThrow(ValidationError);
  });

  it("rejects a malformed body", () => {
    expect(() => validateGoalInput(null, { partial: false })).toThrow(ValidationError);
    expect(() => validateGoalInput([], { partial: false })).toThrow(ValidationError);
    expect(() => validateGoalInput("nope", { partial: false })).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// CRUD + the ON DELETE SET NULL guard
// ---------------------------------------------------------------------------

describe("goals CRUD", () => {
  it("creates a goal unlinked to any account", async () => {
    const goal = await createGoal({ name: "Emergency fund", accountId: null, targetAmount: 5000, targetDate: null, currentAmount: 1200 });
    expect(goal.accountId).toBeNull();
    expect(goal.targetAmount).toBe("5000.00"); // numeric(14,2) read back as a string
    expect(goal.currentAmount).toBe("1200.00");
  });

  it("rejects creating a goal linked to a non-existent account", async () => {
    await expect(
      createGoal({ name: "Trip", accountId: 999999, targetAmount: 100, targetDate: null, currentAmount: 0 }),
    ).rejects.toThrow(ValidationError);
  });

  it("updates fields via a partial patch, leaving others untouched", async () => {
    const goal = await createGoal({ name: "Trip", accountId: null, targetAmount: 1000, targetDate: null, currentAmount: 0 });
    const updated = await updateGoal(goal.id, { targetAmount: 1500 });
    expect(updated?.targetAmount).toBe("1500.00");
    expect(updated?.name).toBe("Trip");
  });

  it("returns null from update/delete for a non-existent id", async () => {
    expect(await updateGoal(999999, { name: "x" })).toBeNull();
    expect(await deleteGoal(999999)).toBeNull();
  });

  it("deletes a goal outright without touching any linked account", async () => {
    const account = await createManualAccount({ name: "Savings", type: "depository", subtype: null, startingBalance: 100, currency: "USD" });
    const goal = await createGoal({ name: "Trip", accountId: account.id, targetAmount: 1000, targetDate: null, currentAmount: 0 });
    const deleted = await deleteGoal(goal.id);
    expect(deleted?.id).toBe(goal.id);
    const [stillThere] = await db.select().from(accounts).where(eq(accounts.id, account.id));
    expect(stillThere).toBeDefined();
  });

  // The binding requirement: deleting a linked account must null the
  // goal's account_id, not delete the goal. Enforced at the DB level (ON
  // DELETE SET NULL on goals.account_id), not in application code, so it
  // holds regardless of how the account row disappears. See the mutation
  // test performed against this exact test, documented in the PR/report:
  // temporarily changing the FK to ON DELETE CASCADE made this test fail
  // (the goal row vanished along with the account), confirming the test
  // actually exercises the constraint.
  it("survives deletion of its linked manual account, with account_id set to null", async () => {
    const account = await createManualAccount({
      name: "House down payment",
      type: "depository",
      subtype: null,
      startingBalance: 2500,
      currency: "USD",
    });
    const goal = await createGoal({
      name: "House down payment goal",
      accountId: account.id,
      targetAmount: 50000,
      targetDate: null,
      currentAmount: 0,
    });

    await deleteManualAccount(account.id);

    const [survivor] = await db.select().from(goals).where(eq(goals.id, goal.id));
    expect(survivor).toBeDefined();
    expect(survivor.accountId).toBeNull();
    // The account itself really is gone -- this isn't a no-op delete.
    const [gone] = await db.select().from(accounts).where(eq(accounts.id, account.id));
    expect(gone).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// goalsWithProgress -- resolves progress from the linked account's balance,
// or from the goal's own manual currentAmount when unlinked.
// ---------------------------------------------------------------------------

describe("goalsWithProgress", () => {
  it("uses the linked account's current_balance for progress, not the goal's own currentAmount", async () => {
    const account = await createManualAccount({ name: "Vacation fund", type: "depository", subtype: null, startingBalance: 750, currency: "USD" });
    await createGoal({ name: "Vacation", accountId: account.id, targetAmount: 1000, targetDate: null, currentAmount: 999 });

    const [row] = await goalsWithProgress();
    expect(row.progress.currentAmount).toBe(750); // from the account, not the ignored 999
    expect(row.progress.remaining).toBe(250);
  });

  it("uses the goal's own currentAmount when unlinked", async () => {
    await createGoal({ name: "New laptop", accountId: null, targetAmount: 2000, targetDate: null, currentAmount: 300 });

    const [row] = await goalsWithProgress();
    expect(row.progress.currentAmount).toBe(300);
    expect(row.progress.remaining).toBe(1700);
  });

  it("reports the true over-100% progress for an over-funded linked goal, uncapped", async () => {
    const account = await createManualAccount({ name: "Bonus fund", type: "depository", subtype: null, startingBalance: 1200, currency: "USD" });
    await createGoal({ name: "Small goal", accountId: account.id, targetAmount: 1000, targetDate: null, currentAmount: 0 });

    const [row] = await goalsWithProgress();
    expect(row.progress.percent).toBe(120);
    expect(row.progress.remaining).toBe(-200);
  });
});

// ---------------------------------------------------------------------------
// Route wiring: every /api/goals route requires auth. Mirrors
// tests/export.test.ts's approach to mocking next/headers' cookies().
// ---------------------------------------------------------------------------

function mockUnauthenticatedCookies() {
  vi.doMock("next/headers", () => ({
    cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
  }));
}

function mockAuthenticatedCookies(token: string) {
  vi.doMock("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) => (name === "fin_session" ? { value: token } : undefined),
      set: () => {},
      delete: () => {},
    }),
  }));
}

describe("goals routes require auth", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.resetModules();
  });

  it("GET /api/goals returns 401 when not logged in", async () => {
    vi.resetModules();
    mockUnauthenticatedCookies();
    const { GET } = await import("@/app/api/goals/route");
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("POST /api/goals returns 401 when not logged in", async () => {
    vi.resetModules();
    mockUnauthenticatedCookies();
    const { POST } = await import("@/app/api/goals/route");
    const res = await POST(new Request("http://localhost/api/goals", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });

  it("PATCH /api/goals/[id] returns 401 when not logged in", async () => {
    vi.resetModules();
    mockUnauthenticatedCookies();
    const { PATCH } = await import("@/app/api/goals/[id]/route");
    const res = await PATCH(new Request("http://localhost/api/goals/1", { method: "PATCH", body: "{}" }), {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/goals/[id] returns 401 when not logged in", async () => {
    vi.resetModules();
    mockUnauthenticatedCookies();
    const { DELETE } = await import("@/app/api/goals/[id]/route");
    const res = await DELETE(new Request("http://localhost/api/goals/1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("goals routes, authenticated", () => {
  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.resetModules();
  });

  it("creates, lists, updates, and deletes a goal end to end", async () => {
    vi.resetModules();
    mockAuthenticatedCookies(sessionToken());
    const { POST, GET } = await import("@/app/api/goals/route");

    const createRes = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Camera", targetAmount: 800, currentAmount: 200 }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.name).toBe("Camera");

    const listRes = await GET();
    const list = await listRes.json();
    expect(list.some((g: { id: number }) => g.id === created.id)).toBe(true);

    const { PATCH, DELETE } = await import("@/app/api/goals/[id]/route");
    const patchRes = await PATCH(
      new Request(`http://localhost/api/goals/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetAmount: 900 }),
      }),
      { params: Promise.resolve({ id: String(created.id) }) },
    );
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).targetAmount).toBe("900.00");

    const deleteRes = await DELETE(new Request(`http://localhost/api/goals/${created.id}`, { method: "DELETE" }), {
      params: Promise.resolve({ id: String(created.id) }),
    });
    expect(deleteRes.status).toBe(200);
  });

  it("PATCH /api/goals/[id] rejects a malformed id", async () => {
    vi.resetModules();
    mockAuthenticatedCookies(sessionToken());
    const { PATCH } = await import("@/app/api/goals/[id]/route");
    const res = await PATCH(new Request("http://localhost/api/goals/abc", { method: "PATCH", body: "{}" }), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
  });
});
