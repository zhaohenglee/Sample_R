import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError } from "./categories";
import { currentDateIso } from "./reports";
import { isValidCalendarDate } from "./manual";

const { goals, accounts } = schema;

const MAX_NAME_LEN = 100;
const MAX_PG_INT = 2147483647; // postgres integer column max
// numeric(14,2); keep well clear of that range so a value that passes our
// own check never trips a Postgres 22003 out of range error either.
// Mirrors src/lib/manual.ts / src/lib/budgets.ts.
const MAX_ABS_AMOUNT = 1e12;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Rejects a value with more than 2 decimal places rather than silently
// rounding it. Mirrors the equivalent checks in src/lib/manual.ts and
// src/lib/budgets.ts.
function hasAtMostTwoDecimals(amount: number): boolean {
  return Math.abs(Math.round(amount * 100) - amount * 100) < 1e-6;
}

function isPositiveInt(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT;
}

// ---------------------------------------------------------------------------
// Pure functions -- no DB, no clock read inside them. `today` is always
// passed in by the caller (goalsWithProgress uses currentDateIso()), which
// is what makes these directly unit testable without faking the system
// clock.
// ---------------------------------------------------------------------------

export type GoalProgress = {
  // Resolved current amount: the linked account's current_balance, or the
  // goal's own manual currentAmount when unlinked.
  currentAmount: number;
  // targetAmount - currentAmount. Not clamped: negative means over-funded
  // by that amount, and callers must not clamp it either -- only the
  // *displayed* percent is capped at 100, per T6.5's accept criteria.
  remaining: number;
  // currentAmount / targetAmount * 100. Deliberately NOT capped at 100 here
  // -- an over-funded goal reports its true percent (e.g. 142.5), and it is
  // the page/component's job to clamp only the progress-bar width with
  // Math.min(percent, 100) for display.
  percent: number;
};

// targetAmount is validated > 0 on every create/update (see
// validateGoalInput), so the <= 0 branch below is unreachable through this
// app's own writes; it stays as a defensive fallback against a row that
// somehow has a non-positive target (e.g. hand-edited in the DB) so this
// function never divides by zero.
export function goalProgress(targetAmount: number, currentAmount: number): GoalProgress {
  const remaining = round2(targetAmount - currentAmount);
  const percent = targetAmount > 0 ? round2((currentAmount / targetAmount) * 100) : 0;
  return { currentAmount, remaining, percent };
}

// The monthly amount still needed to hit `targetAmount` by `targetDate`,
// given `currentAmount` saved so far and today's date `today` (all ISO
// dates, "YYYY-MM-DD"). Pure: no clock read, no DB -- the caller supplies
// `today` (goalsWithProgress passes currentDateIso()).
//
// Returns:
//   - 0 when the goal is already met (remaining <= 0), including an
//     over-funded goal.
//   - null when there is no target date -- there is nothing to divide the
//     remaining amount by, so no monthly figure can be derived. Distinct
//     from 0 (met) and from a number (a real due amount) so callers can
//     tell "no deadline" apart from "nothing left to save".
//   - remaining / monthsRemaining otherwise, rounded to cents.
//
// A target date that is this month or already in the past leaves no whole
// month left to spread the contribution over. Rather than let that turn
// into a division by zero (Infinity), a negative divisor (a negative
// contribution), or NaN, such a date is treated as due in full, this
// month: monthsRemaining is floored at 1, so the function returns the
// entire remaining amount. This is a deliberate choice, not an omission --
// overdue goals do not get a discounted or undefined monthly figure.
export function requiredMonthlyContribution(params: {
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
}): number | null {
  const remaining = round2(params.targetAmount - params.currentAmount);
  if (remaining <= 0) return 0;
  if (params.targetDate === null) return null;

  const [todayYear, todayMonth] = params.today.slice(0, 7).split("-").map(Number);
  const [targetYear, targetMonth] = params.targetDate.slice(0, 7).split("-").map(Number);
  const diff = (targetYear - todayYear) * 12 + (targetMonth - todayMonth);
  const monthsRemaining = diff < 1 ? 1 : diff;
  return round2(remaining / monthsRemaining);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type GoalInput = {
  name: string;
  accountId: number | null;
  targetAmount: number;
  targetDate: string | null;
  currentAmount: number;
};

const ALLOWED_FIELDS = new Set(["name", "accountId", "targetAmount", "targetDate", "currentAmount"]);

// Validates and normalizes a raw JSON request body into a GoalInput.
// `partial: false` (create) requires name, targetAmount, and defaults
// accountId/targetDate to null and currentAmount to 0 when omitted;
// `partial: true` (update) makes every field optional, but any field
// present is still fully validated. Unknown top-level fields are rejected
// outright, same convention as validateCategoryInput.
export function validateGoalInput(body: unknown, opts: { partial: false }): GoalInput;
export function validateGoalInput(body: unknown, opts: { partial: true }): Partial<GoalInput>;
export function validateGoalInput(body: unknown, opts: { partial: boolean }): GoalInput | Partial<GoalInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  const out: Partial<GoalInput> = {};

  if ("name" in obj) {
    if (typeof obj.name !== "string") throw new ValidationError("name must be a string.");
    const name = obj.name.trim();
    if (name.length < 1 || name.length > MAX_NAME_LEN) {
      throw new ValidationError(`name must be between 1 and ${MAX_NAME_LEN} characters.`);
    }
    out.name = name;
  } else if (!opts.partial) {
    throw new ValidationError("name is required.");
  }

  if ("accountId" in obj) {
    if (obj.accountId === null) {
      out.accountId = null;
    } else if (isPositiveInt(obj.accountId)) {
      out.accountId = obj.accountId;
    } else {
      throw new ValidationError("accountId must be a positive integer or null.");
    }
  } else if (!opts.partial) {
    out.accountId = null;
  }

  if ("targetAmount" in obj) {
    const raw = obj.targetAmount;
    if (
      typeof raw !== "number" ||
      !Number.isFinite(raw) ||
      raw <= 0 ||
      raw >= MAX_ABS_AMOUNT ||
      !hasAtMostTwoDecimals(raw)
    ) {
      throw new ValidationError("targetAmount must be a positive number, less than 1e12, with at most 2 decimals.");
    }
    out.targetAmount = raw;
  } else if (!opts.partial) {
    throw new ValidationError("targetAmount is required.");
  }

  if ("targetDate" in obj) {
    if (obj.targetDate === null) {
      out.targetDate = null;
    } else if (typeof obj.targetDate === "string" && isValidCalendarDate(obj.targetDate)) {
      out.targetDate = obj.targetDate;
    } else {
      throw new ValidationError("targetDate must be a valid YYYY-MM-DD date or null.");
    }
  } else if (!opts.partial) {
    out.targetDate = null;
  }

  if ("currentAmount" in obj) {
    const raw = obj.currentAmount;
    if (
      typeof raw !== "number" ||
      !Number.isFinite(raw) ||
      raw < 0 ||
      raw >= MAX_ABS_AMOUNT ||
      !hasAtMostTwoDecimals(raw)
    ) {
      throw new ValidationError("currentAmount must be a number >= 0, less than 1e12, with at most 2 decimals.");
    }
    out.currentAmount = raw;
  } else if (!opts.partial) {
    out.currentAmount = 0;
  }

  return out;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export type Goal = typeof goals.$inferSelect;

export type GoalWithProgress = Goal & {
  accountName: string | null;
  progress: GoalProgress;
  requiredMonthly: number | null;
};

// Every goal, each joined to its linked account's name/nickname and
// current_balance (when linked). Progress and the required monthly
// contribution are computed with today's date read once via
// currentDateIso(), and passed into the pure functions above.
export async function goalsWithProgress(): Promise<GoalWithProgress[]> {
  const rows = await db
    .select({
      goal: goals,
      accountName: accounts.name,
      accountNickname: accounts.nickname,
      accountBalance: accounts.currentBalance,
    })
    .from(goals)
    .leftJoin(accounts, eq(goals.accountId, accounts.id))
    .orderBy(goals.createdAt);

  const today = currentDateIso();

  return rows.map(({ goal, accountName, accountNickname, accountBalance }) => {
    const targetAmount = parseFloat(goal.targetAmount);
    const currentAmount = goal.accountId !== null ? parseFloat(accountBalance ?? "0") : parseFloat(goal.currentAmount);
    const progress = goalProgress(targetAmount, currentAmount);
    const requiredMonthly = requiredMonthlyContribution({
      targetAmount,
      currentAmount,
      targetDate: goal.targetDate,
      today,
    });
    return {
      ...goal,
      accountName: goal.accountId !== null ? (accountNickname ?? accountName ?? null) : null,
      progress,
      requiredMonthly,
    };
  });
}

export async function createGoal(input: GoalInput): Promise<Goal> {
  return db.transaction(async (tx) => {
    if (input.accountId !== null) {
      const [account] = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, input.accountId)).for("update");
      if (!account) throw new ValidationError(`Account ${input.accountId} does not exist.`);
    }
    const [row] = await tx
      .insert(goals)
      .values({
        name: input.name,
        accountId: input.accountId,
        targetAmount: input.targetAmount.toFixed(2),
        currentAmount: input.currentAmount.toFixed(2),
        targetDate: input.targetDate,
      })
      .returning();
    return row;
  });
}

export async function updateGoal(id: number, input: Partial<GoalInput>): Promise<Goal | null> {
  const set: Partial<typeof goals.$inferInsert> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.targetAmount !== undefined) set.targetAmount = input.targetAmount.toFixed(2);
  if (input.currentAmount !== undefined) set.currentAmount = input.currentAmount.toFixed(2);
  if (input.targetDate !== undefined) set.targetDate = input.targetDate;

  return db.transaction(async (tx) => {
    if (input.accountId !== undefined) {
      if (input.accountId !== null) {
        const [account] = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, input.accountId)).for("update");
        if (!account) throw new ValidationError(`Account ${input.accountId} does not exist.`);
      }
      set.accountId = input.accountId;
    }
    if (Object.keys(set).length === 0) {
      const [row] = await tx.select().from(goals).where(eq(goals.id, id));
      return row ?? null;
    }
    const [row] = await tx.update(goals).set(set).where(eq(goals.id, id)).returning();
    return row ?? null;
  });
}

export async function deleteGoal(id: number): Promise<Goal | null> {
  const [row] = await db.delete(goals).where(eq(goals.id, id)).returning();
  return row ?? null;
}
