import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { accountLabel } from "./format";
import { currentDateIso } from "./reports";

const { accounts, transactions, recurring } = schema;

// How far back a sync's transaction window reaches when feeding
// detectRecurring. A yearly cadence needs 3 occurrences spanning ~730 days
// to be detectable at all (2 full yearly gaps); 800 gives that a margin
// without pulling in a third year's worth of history. Comfortably covers
// weekly/monthly too.
const LOOKBACK_DAYS = 800;

export type CadenceType = "weekly" | "monthly" | "yearly";

const CADENCE_TARGET_DAYS: Record<CadenceType, number> = {
  weekly: 7,
  monthly: 30.44,
  yearly: 365.25,
};

const AMOUNT_TOLERANCE = 0.15;
const MIN_OCCURRENCES = 3;

export type RecurringTx = {
  id: number;
  accountId: number;
  date: string; // ISO yyyy-mm-dd
  amount: number; // Plaid convention: positive = money out
  name: string;
  merchantName: string | null;
  categoryId: number | null;
};

export type RecurringCandidate = {
  merchantKey: string;
  displayName: string;
  cadence: CadenceType;
  expectedAmount: number;
  lastDate: string;
  nextDue: string;
  occurrences: number;
  accountId: number;
  categoryId: number | null;
};

// Lower-cases, strips digits and punctuation, collapses whitespace, and
// trims to 40 chars -- turns "Netflix.com 04/12" and "NETFLIX.COM 05/13"
// into the same grouping key ("netflixcom"), since the only difference
// between them is digits and punctuation.
//
// Known grouping weaknesses: anything beyond digits/punctuation defeats
// this. A non-numeric processor prefix ("SQ *Corner Cafe" vs "TST* Corner
// Cafe"), a trailing city/state or store label ("Starbucks Seattle WA" vs
// "Starbucks Portland OR", "Store #12" once the digits are gone still
// leaves the word "Store"), or a per-transaction suffix that mixes letters
// with digits ("AMAZON.COM*A1B2C3" vs "AMAZON.COM*Z9Y8X7" -- the stray
// letters survive digit-stripping and differ) will all fail to collapse to
// one key even though a human would recognize the same merchant. Catching
// those needs fuzzier matching (edit distance, token overlap) than this
// function attempts.
export function normalizeMerchantKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[0-9]/g, "")
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db_ = new Date(b + "T00:00:00Z").getTime();
  return (db_ - da) / 86_400_000;
}

// Day-count offset (not calendar aware) -- used only for the lookback
// cutoff and the upcoming-window bounds, where "N days" is genuinely what
// is meant. next_due uses the calendar-aware helpers below instead.
function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// --- Calendar-aware date arithmetic for next_due --------------------------
// Pure integer arithmetic on the year/month/day parsed out of the ISO
// string -- no Date object anywhere, so there is no local-timezone or
// UTC-conversion drift near month/year boundaries.

function parseIsoDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// `month` is 1-12.
function daysInMonth(y: number, month: number): number {
  if (month === 2 && isLeapYear(y)) return 29;
  return DAYS_IN_MONTH[month - 1];
}

// Adds a non-negative number of calendar days to an ISO date. Used for the
// weekly cadence's next_due (last_date + 7 days).
function addCalendarDays(iso: string, days: number): string {
  let { y, m, d } = parseIsoDate(iso);
  d += days;
  while (d > daysInMonth(y, m)) {
    d -= daysInMonth(y, m);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

// Adds `months` calendar months to an ISO date, keeping the same day of
// month and clamping to the target month's last day when the original day
// doesn't exist there -- e.g. Jan 31 + 1 month -> Feb 28 (or 29 in a leap
// year); Feb 29 + 12 months -> Feb 28 the following (non-leap) year. Used
// for the monthly (months=1) and yearly (months=12) cadences' next_due.
function addCalendarMonths(iso: string, months: number): string {
  const { y, m, d } = parseIsoDate(iso);
  const totalMonths = y * 12 + (m - 1) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  const clampedDay = Math.min(d, daysInMonth(newYear, newMonth));
  return `${newYear}-${pad2(newMonth)}-${pad2(clampedDay)}`;
}

function nextDueFor(cadence: CadenceType, lastDate: string): string {
  if (cadence === "weekly") return addCalendarDays(lastDate, 7);
  if (cadence === "monthly") return addCalendarMonths(lastDate, 1);
  return addCalendarMonths(lastDate, 12);
}

// Collapses postings that landed on the same calendar date within a group
// into one occurrence with the summed amount -- a bill split across two
// same-day transactions (e.g. rent paid in two installments that post the
// same day) must not read as "amounts vary" or distort the interval math.
// `sorted` must already be sorted by date.
function collapseSameDay(sorted: RecurringTx[]): { date: string; amount: number }[] {
  const collapsed: { date: string; amount: number }[] = [];
  for (const t of sorted) {
    const last = collapsed[collapsed.length - 1];
    if (last && last.date === t.date) last.amount += t.amount;
    else collapsed.push({ date: t.date, amount: t.amount });
  }
  return collapsed;
}

// Most common value in `values` (nulls ignored); ties break toward the
// value that appears first (stable across re-runs given a stable input
// order -- callers pass transactions sorted by date).
function mostCommon<T>(values: (T | null)[]): T | null {
  const counts = new Map<T, number>();
  for (const v of values) {
    if (v === null) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: T | null = null;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

// A cadence matches when every interval between consecutive occurrences
// falls within 20% of the cadence's target day count. Monthly gets an
// explicit widened band (25-36 days) to absorb calendar months of
// different lengths, per spec.
function cadenceMatches(cadence: CadenceType, intervalDays: number[]): boolean {
  const target = CADENCE_TARGET_DAYS[cadence];
  if (cadence === "monthly") {
    return intervalDays.every((d) => d >= 25 && d <= 36);
  }
  const lo = target * 0.8;
  const hi = target * 1.2;
  return intervalDays.every((d) => d >= lo && d <= hi);
}

function meanRelativeError(cadence: CadenceType, intervalDays: number[]): number {
  const target = CADENCE_TARGET_DAYS[cadence];
  const errors = intervalDays.map((d) => Math.abs(d - target) / target);
  return errors.reduce((s, e) => s + e, 0) / errors.length;
}

// Pure function: groups posted, non-removed, money-out transactions by
// (accountId, normalizeMerchantKey), and flags groups whose spacing and
// amounts look recurring. Callers are responsible for filtering out
// pending/removed rows before calling this -- it trusts its input.
export function detectRecurring(txs: RecurringTx[], today: string): RecurringCandidate[] {
  const groups = new Map<string, RecurringTx[]>();
  for (const t of txs) {
    if (t.amount <= 0) continue; // only money out
    const key = normalizeMerchantKey(t.merchantName ?? t.name);
    if (!key) continue;
    const groupKey = `${t.accountId}:${key}`;
    const list = groups.get(groupKey);
    if (list) list.push(t);
    else groups.set(groupKey, [t]);
  }

  const candidates: RecurringCandidate[] = [];

  for (const [groupKey, groupTxs] of groups) {
    if (groupTxs.length < MIN_OCCURRENCES) continue;
    const merchantKey = groupKey.slice(groupKey.indexOf(":") + 1);

    const sorted = [...groupTxs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    // Same-day postings collapse to one occurrence (summed amount) before
    // any of the interval/amount/count math below runs.
    const occurrences = collapseSameDay(sorted);
    if (occurrences.length < MIN_OCCURRENCES) continue;

    const amounts = occurrences.map((o) => o.amount);
    const med = median(amounts);
    const amountsOk = amounts.every((a) => med !== 0 && Math.abs(a - med) / med <= AMOUNT_TOLERANCE);
    if (!amountsOk) continue;

    const intervals: number[] = [];
    for (let i = 1; i < occurrences.length; i++) intervals.push(daysBetween(occurrences[i - 1].date, occurrences[i].date));

    let best: { cadence: CadenceType; error: number } | null = null;
    for (const cadence of Object.keys(CADENCE_TARGET_DAYS) as CadenceType[]) {
      if (!cadenceMatches(cadence, intervals)) continue;
      const error = meanRelativeError(cadence, intervals);
      if (!best || error < best.error) best = { cadence, error };
    }
    if (!best) continue;

    const lastDate = occurrences[occurrences.length - 1].date;
    const target = CADENCE_TARGET_DAYS[best.cadence];

    // Stale: the group's last occurrence is more than 2 cadence periods
    // before today -- treat it as no longer active.
    if (daysBetween(lastDate, today) > target * 2) continue;

    const displayName = mostCommon(sorted.map((t) => t.merchantName ?? t.name)) ?? sorted[sorted.length - 1].name;
    const categoryId = mostCommon(sorted.map((t) => t.categoryId));

    candidates.push({
      merchantKey,
      displayName,
      cadence: best.cadence,
      expectedAmount: Math.round(med * 100) / 100,
      lastDate,
      nextDue: nextDueFor(best.cadence, lastDate),
      occurrences: occurrences.length,
      accountId: sorted[0].accountId,
      categoryId,
    });
  }

  return candidates;
}

// Reloads recurring detections from scratch: pulls posted, non-removed
// transactions from visible (non-hidden) accounts over the last
// LOOKBACK_DAYS days, runs detectRecurring, and replaces the entire
// `recurring` table with the result inside one transaction so readers
// never see a partially-cleared table.
export async function refreshRecurring(): Promise<number> {
  const today = currentDateIso();
  const since = addDaysIso(today, -LOOKBACK_DAYS);

  const rows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      date: transactions.date,
      amount: transactions.amount,
      name: transactions.name,
      merchantName: transactions.merchantName,
      categoryId: transactions.categoryId,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(accounts.hidden, false),
        eq(transactions.isPending, false),
        eq(transactions.isRemoved, false),
        gte(transactions.date, since),
      ),
    );

  const txs: RecurringTx[] = rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    date: r.date,
    amount: parseFloat(r.amount),
    name: r.name,
    merchantName: r.merchantName,
    categoryId: r.categoryId,
  }));

  const candidates = detectRecurring(txs, today);

  await db.transaction(async (tx) => {
    await tx.delete(recurring);
    if (candidates.length > 0) {
      await tx.insert(recurring).values(
        candidates.map((c) => ({
          merchantKey: c.merchantKey,
          displayName: c.displayName,
          cadence: c.cadence,
          expectedAmount: c.expectedAmount.toString(),
          lastDate: c.lastDate,
          nextDue: c.nextDue,
          occurrences: c.occurrences,
          accountId: c.accountId,
          categoryId: c.categoryId,
        })),
      );
    }
  });

  return candidates.length;
}

export type UpcomingRecurringRow = {
  id: number;
  displayName: string;
  accountLabel: string;
  cadence: string;
  expectedAmount: string;
  nextDue: string;
  overdue: boolean;
};

const OVERDUE_LOOKBACK_DAYS = 7;

// Recurring rows on visible (non-hidden) accounts due between
// today - 7 days and today + `days` (inclusive on both ends), ordered
// soonest first, joined to accounts for a display label. The 7-day
// lookback surfaces charges that were expected but haven't posted yet
// (`overdue: true` when next_due is before today) instead of silently
// dropping them off the list the moment they're due.
export async function upcomingRecurring(days = 30): Promise<UpcomingRecurringRow[]> {
  const today = currentDateIso();
  const start = addDaysIso(today, -OVERDUE_LOOKBACK_DAYS);
  const end = addDaysIso(today, days);
  const rows = await db
    .select({
      id: recurring.id,
      displayName: recurring.displayName,
      cadence: recurring.cadence,
      expectedAmount: recurring.expectedAmount,
      nextDue: recurring.nextDue,
      accountName: accounts.name,
      accountNickname: accounts.nickname,
    })
    .from(recurring)
    .innerJoin(accounts, eq(recurring.accountId, accounts.id))
    .where(and(eq(accounts.hidden, false), gte(recurring.nextDue, start), lte(recurring.nextDue, end)))
    .orderBy(asc(recurring.nextDue));

  return rows.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    accountLabel: accountLabel({ name: r.accountName, nickname: r.accountNickname }),
    cadence: r.cadence,
    expectedAmount: r.expectedAmount,
    nextDue: r.nextDue,
    overdue: r.nextDue < today,
  }));
}
