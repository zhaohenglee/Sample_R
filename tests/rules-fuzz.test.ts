// Differential fuzz test: matchRule's regex branch (a hand-written,
// no-backtracking NFA simulation -- see the "Restricted regex match
// engine" section of src/lib/rules.ts) must agree with native
// `new RegExp(pattern, "i").test(text)` on every pattern our own dialect
// allows a rule to save. Disagreement here would mean the dialect we
// *validate* at save time and the dialect we *execute* at match time have
// quietly drifted apart.
//
// Fixed seed, fixed iteration count -- deterministic and fast enough for
// CI. For a much larger one-off run (e.g. to re-verify after a change to
// the match engine), override the iteration count:
//   RULES_FUZZ_ITERATIONS=20000 npx vitest run tests/rules-fuzz.test.ts
import { describe, it, expect } from "vitest";
import { matchRule, validateRuleInput, type Rule } from "@/lib/rules";

const ITERATIONS = Number(process.env.RULES_FUZZ_ITERATIONS) || 5000;
const SEED = 0xc0ffee;

// mulberry32: small, fast, deterministic PRNG.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[randInt(rand, 0, arr.length - 1)];
}

// --- Pattern generator: draws from the full accepted dialect -----------
const LETTER_DIGIT_POOL = ["a", "b", "c", "A", "B", "C", "0", "1"];
const SAFE_CLASS_LITERALS = ["a", "b", "c", "A", "B", "C", "0", "1", "_", " "];
// Every ASCII punctuation character our dialect allows escaping.
const ESCAPED_PUNCT_POOL = [".", "-", "$", "[", "]", "\\", "/", "|", "*", "+", "?", "(", ")", "{", "}", "^"];
const CLASS_SHORTCUTS = ["d", "D", "w", "W", "s", "S"];
// Text alphabet, per the rework instructions.
const TEXT_ALPHABET = ["a", "b", "c", "A", "B", "C", "0", "1", " ", "_", "\t", "\r", "\n", ".", "-"];

function randomClassMember(rand: () => number): string {
  const kind = randInt(rand, 0, 2);
  if (kind === 0) {
    return "\\" + pick(rand, CLASS_SHORTCUTS);
  }
  if (kind === 1) {
    const a = pick(rand, LETTER_DIGIT_POOL);
    const b = pick(rand, LETTER_DIGIT_POOL);
    const [lo, hi] = a.codePointAt(0)! <= b.codePointAt(0)! ? [a, b] : [b, a];
    return `${lo}-${hi}`;
  }
  if (rand() < 0.5) return pick(rand, SAFE_CLASS_LITERALS);
  return "\\" + pick(rand, ESCAPED_PUNCT_POOL);
}

function randomClass(rand: () => number): string {
  const negate = rand() < 0.3 ? "^" : "";
  const memberCount = randInt(rand, 1, 3);
  let body = "";
  for (let i = 0; i < memberCount; i++) body += randomClassMember(rand);
  return `[${negate}${body}]`;
}

function randomAtom(rand: () => number): string {
  const kind = randInt(rand, 0, 4);
  if (kind === 0) return pick(rand, LETTER_DIGIT_POOL);
  if (kind === 1) return ".";
  if (kind === 2) return randomClass(rand);
  if (kind === 3) return "\\" + pick(rand, CLASS_SHORTCUTS);
  return "\\" + pick(rand, ESCAPED_PUNCT_POOL);
}

// Returns a base quantifier (no lazy suffix) and how many "quantifier
// units" validateRestrictedRegex will count for it (always 1 here; the
// caller adds a second unit if it appends a lazy "?").
function randomQuantifierBase(rand: () => number): string {
  const kind = randInt(rand, 0, 5);
  if (kind === 0) return "*";
  if (kind === 1) return "+";
  if (kind === 2) return "?";
  if (kind === 3) return `{${randInt(rand, 0, 3)}}`;
  if (kind === 4) return `{${randInt(rand, 0, 2)},}`;
  const lo = randInt(rand, 0, 2);
  const hi = lo + randInt(rand, 0, 2);
  return `{${lo},${hi}}`;
}

// A shared count of quantifier "units" left across the whole pattern
// (all branches), mirroring validateRestrictedRegex's own count -- which
// increments once for the base quantifier and again for a trailing lazy
// "?" -- so the generator never emits more than MAX_QUANTIFIERS (4).
type Budget = { remaining: number };

function generateBranch(rand: () => number, budget: Budget): string {
  let out = "";
  if (rand() < 0.3) out += "^";
  const atomCount = randInt(rand, 1, 5);
  for (let i = 0; i < atomCount; i++) {
    out += randomAtom(rand);
    if (budget.remaining > 0 && rand() < 0.4) {
      let q = randomQuantifierBase(rand);
      budget.remaining -= 1;
      if (budget.remaining > 0 && rand() < 0.4) {
        q += "?";
        budget.remaining -= 1;
      }
      out += q;
    }
    // Occasional anchor in the middle of the branch -- syntactically legal
    // (zero-width, never quantified) and part of "anchors anywhere".
    if (rand() < 0.1) out += rand() < 0.5 ? "^" : "$";
  }
  if (rand() < 0.3) out += "$";
  return out;
}

function generatePattern(rand: () => number): string {
  const branchCount = rand() < 0.3 ? 2 : 1;
  const budget: Budget = { remaining: 4 };
  const branches: string[] = [];
  for (let i = 0; i < branchCount; i++) branches.push(generateBranch(rand, budget));
  return branches.join("|");
}

function generateText(rand: () => number): string {
  const len = randInt(rand, 0, 12);
  let out = "";
  for (let i = 0; i < len; i++) out += pick(rand, TEXT_ALPHABET);
  return out;
}

function isSavablePattern(pattern: string): boolean {
  try {
    validateRuleInput({ name: "fuzz", field: "name", match: "regex", pattern, categoryId: 1 }, { partial: false });
    return true;
  } catch {
    return false;
  }
}

function engineMatch(pattern: string, text: string): boolean {
  const rule: Rule = {
    id: 1,
    name: "fuzz",
    field: "name",
    match: "regex",
    pattern,
    amountMin: null,
    amountMax: null,
    accountId: null,
    categoryId: 1,
    setDisplayName: null,
    priority: 100,
    enabled: true,
    createdAt: new Date(),
  } as Rule;
  return matchRule(rule, { name: text, merchantName: null, amount: 1, accountId: 1 });
}

function nativeMatch(pattern: string, text: string): boolean {
  return new RegExp(pattern, "i").test(text);
}

describe("rules regex engine differential fuzz", () => {
  it(`agrees with native RegExp over ${ITERATIONS} savable patterns (seed ${SEED})`, () => {
    const rand = mulberry32(SEED);
    let comparisons = 0;
    let attempts = 0;
    const maxAttempts = ITERATIONS * 20;
    const disagreements: Array<{ pattern: string; text: string; engine: boolean; native: boolean }> = [];

    while (comparisons < ITERATIONS && attempts < maxAttempts) {
      attempts += 1;
      const pattern = generatePattern(rand);
      if (!isSavablePattern(pattern)) continue;

      const text = generateText(rand);
      comparisons += 1;

      const engine = engineMatch(pattern, text);
      const native = nativeMatch(pattern, text);
      if (engine !== native) {
        disagreements.push({ pattern, text, engine, native });
      }
    }

    expect(comparisons, "expected to gather enough savable patterns").toBe(ITERATIONS);
    if (disagreements.length > 0) {
      const sample = disagreements
        .slice(0, 10)
        .map((d) => `pattern=${JSON.stringify(d.pattern)} text=${JSON.stringify(d.text)} engine=${d.engine} native=${d.native}`)
        .join("\n");
      throw new Error(`${disagreements.length}/${comparisons} disagreements. First ${Math.min(10, disagreements.length)}:\n${sample}`);
    }

    // eslint-disable-next-line no-console
    console.log(`rules-fuzz: ${comparisons} comparisons, ${disagreements.length} disagreements (seed ${SEED}).`);
  });
});
