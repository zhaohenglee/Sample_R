import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ValidationError, assertCleanString } from "./categories";

const { categoryRules, categories, accounts } = schema;

export type Rule = typeof categoryRules.$inferSelect;

export type RuleInput = {
  name: string;
  field: "name" | "merchant_name" | "any";
  match: "contains" | "starts_with" | "regex";
  pattern: string;
  amountMin?: number | null;
  amountMax?: number | null;
  accountId?: number | null;
  categoryId: number;
  setDisplayName?: string | null;
  priority?: number;
  enabled?: boolean;
};

const ALLOWED_FIELDS = new Set([
  "name",
  "field",
  "match",
  "pattern",
  "amountMin",
  "amountMax",
  "accountId",
  "categoryId",
  "setDisplayName",
  "priority",
  "enabled",
]);

const FIELD_VALUES = new Set(["name", "merchant_name", "any"]);
const MATCH_VALUES = new Set(["contains", "starts_with", "regex"]);

const MAX_NAME_LEN = 60;
const MAX_PATTERN_LEN = 200;
const MAX_DISPLAY_NAME_LEN = 120;
const MAX_PG_INT = 2147483647;
// Amount columns are numeric(14,2); keep well clear of that range so a
// value that passes our own check never trips a Postgres 22003 out of
// range error either.
const MAX_ABS_AMOUNT = 1e12;
// Cap the string tested against a regex. Matching does not hand the
// pattern to the native RegExp engine (see the match engine below the
// pattern-save validation) -- it runs a position-set NFA simulation over
// the restricted dialect instead, which is O(pattern length * text length)
// with no backtracking of any kind. This cap just keeps that product small
// (<= 200 * 300 = 60,000 steps), not a backtracking mitigation.
const MAX_REGEX_INPUT_LEN = 300;

// Thrown for a malformed request body (unknown/missing/mistyped field,
// invalid regex, amount_min > amount_max, ...). Route handlers translate
// this to 400.
export { ValidationError };

// Thrown when category_id or account_id refers to a row that does not
// exist. Route handlers translate this to 400.
export class InvalidReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidReferenceError";
  }
}

// amount_min/amount_max: a finite number, well within the numeric(14,2)
// column's range (and Postgres's own 22003 out-of-range error, as a
// backstop -- see isPgDataError in the route handlers).
function isValidAmount(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isFinite(raw) && Math.abs(raw) < MAX_ABS_AMOUNT;
}

function isPositiveInt(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT;
}

const MAX_QUANTIFIERS = 4;

// --- Restricted regex dialect: shared parsing primitives ----------------
//
// The accepted dialect is defined by what this engine actually implements,
// not by a separate description of it: validateRestrictedRegex (save time)
// and compilePattern (match time) share the same character-class parser
// (parseCharClass) and the same escape whitelist (isAllowedEscapeChar /
// escapeTest), so there is exactly one place that decides what a `\x` or a
// `[a-z]` means. No groups of any kind (capturing, non-capturing,
// lookahead/lookbehind -- all start with "("), no backreferences, and at
// most MAX_QUANTIFIERS quantifiers with no quantifier stacked directly on
// another (except a single trailing lazy "?", e.g. "*?").

type Term =
  | { kind: "anchorStart" }
  | { kind: "anchorEnd" }
  | { kind: "atom"; test: (ch: string) => boolean; min: number; max: number };

// Only \d \D \w \W \s \S, or a backslash followed by a single non-
// alphanumeric ASCII character (escaped punctuation: \. \- \$ \[ \] \\ \/
// \| \* \+ \? \( \) \{ \} \^ ...). Anything else escaped -- \n \t \r \f \v
// \b \B \x.. \u.... \0, a digit (backreference), or any other letter -- is
// rejected outright rather than silently reinterpreted.
function isAllowedEscapeChar(esc: string): boolean {
  if (esc === "d" || esc === "D" || esc === "w" || esc === "W" || esc === "s" || esc === "S") return true;
  const code = esc.codePointAt(0);
  if (code === undefined || code >= 128) return false;
  return !/[A-Za-z0-9]/.test(esc);
}

function escapeNotSupportedMessage(esc: string): string {
  return `escape \\${esc} is not supported in rule patterns; only \\d \\w \\s and escaped punctuation are allowed.`;
}

// A single escaped character, assumed already checked by
// isAllowedEscapeChar: one of the six class shortcuts (implemented with
// JavaScript's own single-character \d/\w/\s tests, which is safe because
// it is a one-character test with no backtracking), or otherwise a literal
// match on the escaped punctuation character itself.
function escapeTest(esc: string | undefined): (ch: string) => boolean {
  switch (esc) {
    case "d": return (c) => /\d/.test(c);
    case "D": return (c) => !/\d/.test(c);
    case "w": return (c) => /\w/.test(c);
    case "W": return (c) => !/\w/.test(c);
    case "s": return (c) => /\s/.test(c);
    case "S": return (c) => !/\s/.test(c);
    default: {
      if (esc === undefined) return () => false;
      return (c) => c === esc;
    }
  }
}

// "." matches anything except the four line terminators JavaScript's own
// (non-dotAll) "." excludes.
const DOT_EXCLUDED = new Set(["\n", "\r", " ", " "]);
function dotTest(c: string): boolean {
  return !DOT_EXCLUDED.has(c);
}

// A class range's endpoints are stored raw (not case-folded); at match
// time a candidate matches if it, its lowercase form, or its uppercase
// form falls within [lo, hi] by code point -- this is what gives a range
// like [A-z] the same (slightly odd, but JS-consistent) membership as the
// native engine, including punctuation that happens to sit between the
// cased letter blocks.
function rangeTest(lo: string, hi: string): (c: string) => boolean {
  const loCode = lo.codePointAt(0)!;
  const hiCode = hi.codePointAt(0)!;
  return (c: string) => {
    for (const variant of [c, c.toLowerCase(), c.toUpperCase()]) {
      const code = variant.codePointAt(0);
      if (code !== undefined && code >= loCode && code <= hiCode) return true;
    }
    return false;
  };
}

// Same case handling as rangeTest, for a plain (non-range) class member.
function literalClassTest(lit: string): (c: string) => boolean {
  return (c: string) => c === lit || c.toLowerCase() === lit || c.toUpperCase() === lit;
}

// Parses a `[...]` character class starting at `pattern[start]` ("["),
// validating it (the escape whitelist, and that every "lo-hi" range has
// lo <= hi by code point) in the same pass that builds its membership
// predicate. Called from both validateRestrictedRegex (save time, where
// only `end` is used) and compilePattern (match time, where the predicate
// is used) so the two can never disagree about what a class means.
function parseCharClass(pattern: string, start: number): { predicate: (ch: string) => boolean; end: number } {
  let i = start + 1;
  let negate = false;
  if (pattern[i] === "^") {
    negate = true;
    i += 1;
  }
  const tests: Array<(ch: string) => boolean> = [];
  while (i < pattern.length && pattern[i] !== "]") {
    if (pattern[i] === "\\") {
      const esc = pattern[i + 1];
      if (esc === undefined) throw new ValidationError("pattern has a trailing backslash.");
      if (!isAllowedEscapeChar(esc)) throw new ValidationError(escapeNotSupportedMessage(esc));
      tests.push(escapeTest(esc));
      i += 2;
      continue;
    }
    if (pattern[i + 1] === "-" && pattern[i + 2] !== undefined && pattern[i + 2] !== "]" && pattern[i + 2] !== "\\") {
      const lo = pattern[i];
      const hi = pattern[i + 2];
      if (lo.codePointAt(0)! > hi.codePointAt(0)!) {
        throw new ValidationError("invalid range in character class.");
      }
      tests.push(rangeTest(lo, hi));
      i += 3;
      continue;
    }
    tests.push(literalClassTest(pattern[i]));
    i += 1;
  }
  if (pattern[i] !== "]") {
    throw new ValidationError("pattern has an unterminated character class.");
  }
  const end = i;
  return {
    predicate: (c: string) => {
      const matched = tests.some((t) => t(c));
      return negate ? !matched : matched;
    },
    end,
  };
}

// Splits a pattern into its top-level "|" alternatives. There is no
// grouping in this dialect, so "|" is only ever a top-level separator; a
// backslash-escaped char and a [...] class are skipped as atomic units so
// an escaped or class-internal "|" is never mistaken for one.
function splitAlternatives(pattern: string): string[] {
  const parts: string[] = [];
  let inClass = false;
  let start = 0;
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (inClass) {
      if (ch === "]") inClass = false;
      i += 1;
      continue;
    }
    if (ch === "[") {
      inClass = true;
      i += 1;
      continue;
    }
    if (ch === "|") {
      parts.push(pattern.slice(start, i));
      start = i + 1;
      i += 1;
      continue;
    }
    i += 1;
  }
  parts.push(pattern.slice(start));
  return parts;
}

// Parses one alternative branch into a sequence of terms. Assumes the
// branch already passed validateRestrictedRegex. Quantifier laziness is
// parsed and discarded: laziness only changes which match is found first,
// never whether a match exists, and existence is all matchRule needs.
function parseBranch(branch: string): Term[] {
  const terms: Term[] = [];
  let i = 0;
  while (i < branch.length) {
    const ch = branch[i];

    if (ch === "^") {
      terms.push({ kind: "anchorStart" });
      i += 1;
      continue;
    }
    if (ch === "$") {
      terms.push({ kind: "anchorEnd" });
      i += 1;
      continue;
    }

    let test: (c: string) => boolean;
    if (ch === "\\") {
      test = escapeTest(branch[i + 1]);
      i += 2;
    } else if (ch === "[") {
      const { predicate, end } = parseCharClass(branch, i);
      test = predicate;
      i = end + 1;
    } else if (ch === ".") {
      test = dotTest;
      i += 1;
    } else {
      const lit = ch.toLowerCase();
      test = (c) => c.toLowerCase() === lit;
      i += 1;
    }

    let min = 1;
    let max = 1;
    const q = branch[i];
    if (q === "*") {
      min = 0;
      max = Infinity;
      i += 1;
    } else if (q === "+") {
      min = 1;
      max = Infinity;
      i += 1;
    } else if (q === "?") {
      min = 0;
      max = 1;
      i += 1;
    } else if (q === "{") {
      const close = branch.indexOf("}", i + 1);
      const body = close !== -1 ? branch.slice(i + 1, close) : null;
      const m = body !== null ? /^(\d+)(,(\d*))?$/.exec(body) : null;
      if (m) {
        min = Number(m[1]);
        max = m[2] ? (m[3] ? Number(m[3]) : Infinity) : min;
        i = close + 1;
      }
    }
    // A single trailing lazy "?" after a quantifier -- consume and ignore.
    if ((q === "*" || q === "+" || q === "?" || q === "{") && branch[i] === "?") {
      i += 1;
    }

    terms.push({ kind: "atom", test, min, max });
  }
  return terms;
}

function compilePattern(pattern: string): Term[][] {
  return splitAlternatives(pattern).map(parseBranch);
}

// Structural + content validation for what a rule pattern is allowed to
// *save* as: no groups, no unsupported escapes, no invalid character-class
// range, no quantifier stacked directly on another, at most
// MAX_QUANTIFIERS quantifiers total. Character classes are validated by
// parseCharClass itself (shared with compilePattern -- see above), so this
// walk only has to handle everything else.
function validateRestrictedRegex(pattern: string): void {
  let quantifierCount = 0;
  let lastWasQuantifier = false;
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    if (ch === "\\") {
      const next = pattern[i + 1];
      if (next === undefined) {
        throw new ValidationError("pattern has a trailing backslash.");
      }
      if (!isAllowedEscapeChar(next)) {
        throw new ValidationError(escapeNotSupportedMessage(next));
      }
      i += 2;
      lastWasQuantifier = false;
      continue;
    }

    if (ch === "[") {
      const { end } = parseCharClass(pattern, i);
      i = end + 1;
      lastWasQuantifier = false;
      continue;
    }

    if (ch === "(") {
      throw new ValidationError("groups are not supported in rule patterns.");
    }

    if (ch === "*" || ch === "+" || ch === "?") {
      if (lastWasQuantifier) {
        if (ch !== "?") {
          throw new ValidationError("a quantifier cannot immediately follow another quantifier in rule patterns.");
        }
        // A single lazy "?" is allowed right after a quantifier, but it
        // does not itself become a fresh base for stacking further.
        quantifierCount += 1;
        if (quantifierCount > MAX_QUANTIFIERS) {
          throw new ValidationError(`rule patterns support at most ${MAX_QUANTIFIERS} quantifiers.`);
        }
        lastWasQuantifier = false;
        i += 1;
        continue;
      }
      quantifierCount += 1;
      if (quantifierCount > MAX_QUANTIFIERS) {
        throw new ValidationError(`rule patterns support at most ${MAX_QUANTIFIERS} quantifiers.`);
      }
      lastWasQuantifier = true;
      i += 1;
      continue;
    }

    if (ch === "{") {
      const closeIdx = pattern.indexOf("}", i + 1);
      const body = closeIdx !== -1 ? pattern.slice(i + 1, closeIdx) : null;
      if (body !== null && /^\d+(,\d*)?$/.test(body)) {
        if (lastWasQuantifier) {
          throw new ValidationError("a quantifier cannot immediately follow another quantifier in rule patterns.");
        }
        quantifierCount += 1;
        if (quantifierCount > MAX_QUANTIFIERS) {
          throw new ValidationError(`rule patterns support at most ${MAX_QUANTIFIERS} quantifiers.`);
        }
        lastWasQuantifier = true;
        i = closeIdx + 1;
        continue;
      }
      // Not `{n}`/`{n,}`/`{n,m}` syntax -- treat as a literal brace.
      lastWasQuantifier = false;
      i += 1;
      continue;
    }

    lastWasQuantifier = false;
    i += 1;
  }
}

// Restricted-dialect check first, then a plain compile check as a backstop
// for save-time-only syntax issues the dialect check doesn't itself parse
// (e.g. a dangling top-level "|" with an empty branch on one side, which
// is syntactically fine for us but let native RegExp have the last word).
// Match-time validation (getCompiledPattern, below matchesPattern) only
// re-runs validateRestrictedRegex -- it does not repeat this native check.
function validateRegexPattern(pattern: string): void {
  validateRestrictedRegex(pattern);
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern, "i");
  } catch {
    throw new ValidationError("pattern is not a valid regular expression.");
  }
}

// Validates and normalizes a raw JSON request body into a RuleInput.
// `partial: false` (create) requires name/field/match/pattern/categoryId;
// `partial: true` (update) makes every field optional, but any field
// present is still fully validated. Unknown top-level fields are rejected.
export function validateRuleInput(body: unknown, opts: { partial: false }): RuleInput;
export function validateRuleInput(body: unknown, opts: { partial: true }): Partial<RuleInput>;
export function validateRuleInput(body: unknown, opts: { partial: boolean }): RuleInput | Partial<RuleInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_FIELDS.has(key)) throw new ValidationError(`Unknown field "${key}".`);
  }

  const out: Partial<RuleInput> = {};

  if ("name" in obj) {
    const raw = obj.name;
    if (typeof raw !== "string") throw new ValidationError("name must be a string.");
    out.name = assertCleanString(raw.trim(), "name", 1, MAX_NAME_LEN);
  } else if (!opts.partial) {
    throw new ValidationError("name is required.");
  }

  if ("field" in obj) {
    const raw = obj.field;
    if (typeof raw !== "string" || !FIELD_VALUES.has(raw)) {
      throw new ValidationError('field must be one of "name", "merchant_name", "any".');
    }
    out.field = raw as RuleInput["field"];
  } else if (!opts.partial) {
    throw new ValidationError("field is required.");
  }

  if ("match" in obj) {
    const raw = obj.match;
    if (typeof raw !== "string" || !MATCH_VALUES.has(raw)) {
      throw new ValidationError('match must be one of "contains", "starts_with", "regex".');
    }
    out.match = raw as RuleInput["match"];
  } else if (!opts.partial) {
    throw new ValidationError("match is required.");
  }

  // Pattern is validated together with match: a regex match needs the
  // final `match` value (which may come from this same partial update or,
  // on a partial update that doesn't touch pattern, be irrelevant here --
  // updateRule re-validates the combined result against the stored row).
  if ("pattern" in obj) {
    const raw = obj.pattern;
    if (typeof raw !== "string") throw new ValidationError("pattern must be a string.");
    assertCleanString(raw, "pattern", 1, MAX_PATTERN_LEN);
    const effectiveMatch = out.match ?? (obj.match as string | undefined);
    if (effectiveMatch === "regex") {
      validateRegexPattern(raw);
    }
    out.pattern = raw;
  } else if (!opts.partial) {
    throw new ValidationError("pattern is required.");
  }

  if ("amountMin" in obj) {
    const raw = obj.amountMin;
    if (raw === null) {
      out.amountMin = null;
    } else if (isValidAmount(raw)) {
      out.amountMin = raw;
    } else {
      throw new ValidationError("amountMin must be a finite number less than 1e12 in magnitude, or null.");
    }
  }

  if ("amountMax" in obj) {
    const raw = obj.amountMax;
    if (raw === null) {
      out.amountMax = null;
    } else if (isValidAmount(raw)) {
      out.amountMax = raw;
    } else {
      throw new ValidationError("amountMax must be a finite number less than 1e12 in magnitude, or null.");
    }
  }

  if (out.amountMin != null && out.amountMax != null && out.amountMin > out.amountMax) {
    throw new ValidationError("amountMin must be less than or equal to amountMax.");
  }

  if ("accountId" in obj) {
    const raw = obj.accountId;
    if (raw === null) {
      out.accountId = null;
    } else if (isPositiveInt(raw)) {
      out.accountId = raw;
    } else {
      throw new ValidationError("accountId must be a positive integer or null.");
    }
  }

  if ("categoryId" in obj) {
    const raw = obj.categoryId;
    if (!isPositiveInt(raw)) throw new ValidationError("categoryId must be a positive integer.");
    out.categoryId = raw;
  } else if (!opts.partial) {
    throw new ValidationError("categoryId is required.");
  }

  if ("setDisplayName" in obj) {
    const raw = obj.setDisplayName;
    if (raw === null) {
      out.setDisplayName = null;
    } else if (typeof raw === "string") {
      out.setDisplayName = assertCleanString(raw.trim(), "setDisplayName", 1, MAX_DISPLAY_NAME_LEN);
    } else {
      throw new ValidationError("setDisplayName must be a string or null.");
    }
  }

  if ("priority" in obj) {
    const raw = obj.priority;
    if (typeof raw !== "number" || !Number.isSafeInteger(raw) || raw < 0 || raw > MAX_PG_INT) {
      throw new ValidationError("priority must be a non-negative integer.");
    }
    out.priority = raw;
  }

  if ("enabled" in obj) {
    const raw = obj.enabled;
    if (typeof raw !== "boolean") throw new ValidationError("enabled must be a boolean.");
    out.enabled = raw;
  }

  return out;
}

// The minimal transaction shape matchRule needs. Plaid convention: positive
// amount = money out, negative = money in.
export type MatchableTx = {
  name: string;
  merchantName: string | null;
  amount: number;
  accountId: number;
};

// Pure predicate: does this rule match this transaction? Case insensitive.
// field "any" matches when either name or merchant_name matches.
export function matchRule(rule: Rule, tx: MatchableTx): boolean {
  if (!rule.enabled) return false;

  if (rule.accountId != null && rule.accountId !== tx.accountId) return false;

  if (rule.amountMin != null && tx.amount < Number(rule.amountMin)) return false;
  if (rule.amountMax != null && tx.amount > Number(rule.amountMax)) return false;

  const candidates: string[] = [];
  if (rule.field === "name" || rule.field === "any") candidates.push(tx.name);
  if (rule.field === "merchant_name" || rule.field === "any") {
    if (tx.merchantName != null) candidates.push(tx.merchantName);
  }
  if (candidates.length === 0) return false;

  return candidates.some((c) => matchesPattern(rule.match, rule.pattern, c));
}

// --- Restricted-regex match engine -----------------------------------
//
// validateRestrictedRegex (above) only guards what a rule is allowed to
// *save*. Handing an allowed pattern to the native, backtracking RegExp
// engine at match time is not actually safe on its own: a pattern like
// ".*.*.*.*x" has no groups, no backreferences, and only 4 quantifiers --
// legal under every rule above -- yet V8's backtracking engine takes over a
// minute to fail it against a few hundred characters, because backtracking
// explores every way to split the input across the four independent
// wildcards. So matching does not use RegExp at all: it compiles the
// restricted dialect (no groups means no ambiguity to backtrack over) into
// a tiny position-set NFA simulation, which is a single O(pattern length *
// text length) pass with no backtracking, regardless of pattern shape.
// compilePattern/parseBranch/parseCharClass/escapeTest are the same
// functions validateRestrictedRegex used above, so there is exactly one
// definition of the dialect for both save-time validation and match-time
// execution to agree on.

// For each start index p, the number of consecutive characters from p that
// satisfy `test` (0 if text[p] itself doesn't). O(n).
function runLengths(text: string, test: (ch: string) => boolean): number[] {
  const n = text.length;
  const runs = new Array<number>(n + 1).fill(0);
  for (let p = n - 1; p >= 0; p--) {
    runs[p] = test(text[p]) ? runs[p + 1] + 1 : 0;
  }
  return runs;
}

// Position-set NFA simulation: `positions[p]` means "the terms processed so
// far can consume a prefix of `text` ending at index p". No term ever
// revisits a position already explored for it, so this is O(terms.length *
// text.length) regardless of how many ways there are to reach a position --
// there is no backtracking to blow up.
function alternativeMatches(terms: Term[], text: string): boolean {
  const n = text.length;
  let positions = new Uint8Array(n + 1);
  if (terms[0]?.kind === "anchorStart") {
    positions[0] = 1;
  } else {
    positions.fill(1);
  }

  for (const term of terms) {
    const next = new Uint8Array(n + 1);
    if (term.kind === "anchorStart") {
      if (positions[0]) next[0] = 1;
    } else if (term.kind === "anchorEnd") {
      if (positions[n]) next[n] = 1;
    } else {
      const runs = runLengths(text, term.test);
      const diff = new Int32Array(n + 2);
      for (let p = 0; p <= n; p++) {
        if (!positions[p]) continue;
        const avail = runs[p];
        if (avail < term.min) continue;
        const hi = term.max === Infinity ? avail : Math.min(avail, term.max);
        if (hi < term.min) continue;
        diff[p + term.min] += 1;
        diff[p + hi + 1] -= 1;
      }
      let running = 0;
      for (let idx = 0; idx <= n; idx++) {
        running += diff[idx];
        next[idx] = running > 0 ? 1 : 0;
      }
    }
    positions = next;
  }

  return positions.some((v) => v === 1);
}

type CompiledPattern = { ok: true; branches: Term[][] } | { ok: false };

// Cap how many distinct patterns' compiled programs we keep around. Simple
// FIFO eviction (oldest inserted key first) rather than true LRU -- this
// only exists to avoid re-parsing the same handful of rule patterns on
// every transaction, not to be a general-purpose cache.
const PATTERN_CACHE_LIMIT = 500;
const patternCache = new Map<string, CompiledPattern>();

// Fail closed: match time re-runs the same dialect check save time
// enforces (validateRestrictedRegex), and never touches the pattern with
// native RegExp at all. A pattern that doesn't pass it -- a row written
// before this rework, or inserted directly via SQL -- simply never
// matches, rather than falling back to some other interpretation of it.
function getCompiledPattern(pattern: string): CompiledPattern {
  const cached = patternCache.get(pattern);
  if (cached) return cached;

  let result: CompiledPattern;
  try {
    validateRestrictedRegex(pattern);
    result = { ok: true, branches: compilePattern(pattern) };
  } catch {
    result = { ok: false };
  }

  if (patternCache.size >= PATTERN_CACHE_LIMIT) {
    const oldest = patternCache.keys().next().value;
    if (oldest !== undefined) patternCache.delete(oldest);
  }
  patternCache.set(pattern, result);
  return result;
}

function matchesPattern(match: Rule["match"], pattern: string, value: string): boolean {
  if (match === "contains") {
    return value.toLowerCase().includes(pattern.toLowerCase());
  }
  if (match === "starts_with") {
    return value.toLowerCase().startsWith(pattern.toLowerCase());
  }
  if (match === "regex") {
    // Only the regex branch needs the length cap: contains/starts_with are
    // linear-time string ops with nothing to blow up on.
    const truncated = value.slice(0, MAX_REGEX_INPUT_LEN);
    const compiled = getCompiledPattern(pattern);
    if (!compiled.ok) return false;
    return compiled.branches.some((terms) => alternativeMatches(terms, truncated));
  }
  return false;
}

export async function listRules(): Promise<Rule[]> {
  return db.select().from(categoryRules).orderBy(categoryRules.priority, categoryRules.id);
}

function toInsertSet(input: Partial<RuleInput>): Partial<typeof categoryRules.$inferInsert> {
  const set: Partial<typeof categoryRules.$inferInsert> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.field !== undefined) set.field = input.field;
  if (input.match !== undefined) set.match = input.match;
  if (input.pattern !== undefined) set.pattern = input.pattern;
  if (input.amountMin !== undefined) set.amountMin = input.amountMin === null ? null : String(input.amountMin);
  if (input.amountMax !== undefined) set.amountMax = input.amountMax === null ? null : String(input.amountMax);
  if (input.accountId !== undefined) set.accountId = input.accountId;
  if (input.categoryId !== undefined) set.categoryId = input.categoryId;
  if (input.setDisplayName !== undefined) set.setDisplayName = input.setDisplayName;
  if (input.priority !== undefined) set.priority = input.priority;
  if (input.enabled !== undefined) set.enabled = input.enabled;
  return set;
}

type Queryable = Pick<typeof db, "select">;

async function assertCategoryExists(tx: Queryable, categoryId: number): Promise<void> {
  const [row] = await tx.select().from(categories).where(eq(categories.id, categoryId)).for("update");
  if (!row) throw new InvalidReferenceError(`Category ${categoryId} does not exist.`);
}

async function assertAccountExists(tx: Queryable, accountId: number): Promise<void> {
  const [row] = await tx.select().from(accounts).where(eq(accounts.id, accountId)).for("update");
  if (!row) throw new InvalidReferenceError(`Account ${accountId} does not exist.`);
}

export async function createRule(input: RuleInput): Promise<Rule> {
  return db.transaction(async (tx) => {
    await assertCategoryExists(tx, input.categoryId);
    if (input.accountId != null) await assertAccountExists(tx, input.accountId);

    const values = {
      name: input.name,
      field: input.field,
      match: input.match,
      pattern: input.pattern,
      amountMin: input.amountMin == null ? null : String(input.amountMin),
      amountMax: input.amountMax == null ? null : String(input.amountMax),
      accountId: input.accountId ?? null,
      categoryId: input.categoryId,
      setDisplayName: input.setDisplayName ?? null,
      priority: input.priority ?? 100,
      enabled: input.enabled ?? true,
    };
    const [row] = await tx.insert(categoryRules).values(values).returning();
    return row;
  });
}

export async function updateRule(id: number, input: Partial<RuleInput>): Promise<Rule | null> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(categoryRules).where(eq(categoryRules.id, id)).for("update");
    if (!existing) return null;

    if (input.categoryId !== undefined) await assertCategoryExists(tx, input.categoryId);
    if (input.accountId !== undefined && input.accountId !== null) await assertAccountExists(tx, input.accountId);

    // Re-validate amountMin/amountMax and regex pattern against the merged
    // (existing + incoming) row, since a partial update might change only
    // one side of a constraint.
    const mergedMin = input.amountMin !== undefined ? input.amountMin : existing.amountMin == null ? null : Number(existing.amountMin);
    const mergedMax = input.amountMax !== undefined ? input.amountMax : existing.amountMax == null ? null : Number(existing.amountMax);
    if (mergedMin != null && mergedMax != null && mergedMin > mergedMax) {
      throw new ValidationError("amountMin must be less than or equal to amountMax.");
    }
    const mergedMatch = input.match !== undefined ? input.match : existing.match;
    const mergedPattern = input.pattern !== undefined ? input.pattern : existing.pattern;
    if (mergedMatch === "regex") {
      validateRegexPattern(mergedPattern);
    }

    const set = toInsertSet(input);
    if (Object.keys(set).length === 0) return existing;

    const [row] = await tx.update(categoryRules).set(set).where(eq(categoryRules.id, id)).returning();
    return row ?? null;
  });
}

export async function deleteRule(id: number): Promise<Rule | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(categoryRules).where(eq(categoryRules.id, id)).for("update");
    if (!row) return null;
    await tx.delete(categoryRules).where(eq(categoryRules.id, id));
    return row;
  });
}
