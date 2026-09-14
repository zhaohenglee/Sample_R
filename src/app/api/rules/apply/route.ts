import { and, eq, gt } from "drizzle-orm";
import { requireAuthApi } from "@/lib/auth";
import { db, schema } from "@/db";
import { applyRulesToTransactions } from "@/lib/rules";

const { transactions } = schema;

const MAX_PG_INT = 2147483647;
const ID_PAGE_SIZE = 500;
const ALLOWED_FIELDS = new Set(["ruleId", "includeEdited", "dryRun"]);

function isPositiveInt(raw: unknown): raw is number {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw > 0 && raw <= MAX_PG_INT;
}

// Pages through every non-removed transaction id (oldest id first,
// ID_PAGE_SIZE per query) and hands each page straight to
// applyRulesToTransactions as its own batch, summing the matched/changed
// counts as it goes. Ids are never accumulated into one big in-memory list:
// a backfill over a huge table only ever holds one page's worth of ids (and,
// inside applyRulesToTransactions, one page's worth of locked rows) at a
// time.
async function applyRulesToAllTransactions(opts: {
  ruleId?: number;
  includeEdited: boolean;
  dryRun: boolean;
}): Promise<{ matched: number; changed: number }> {
  let matched = 0;
  let changed = 0;
  let lastId = 0;
  for (;;) {
    const rows = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(and(eq(transactions.isRemoved, false), gt(transactions.id, lastId)))
      .orderBy(transactions.id)
      .limit(ID_PAGE_SIZE);
    if (rows.length === 0) break;

    const ids = rows.map((r) => r.id);
    const page = await applyRulesToTransactions(ids, opts);
    matched += page.matched;
    changed += page.changed;

    lastId = ids[ids.length - 1];
    if (rows.length < ID_PAGE_SIZE) break;
  }
  return { matched, changed };
}

// POST { ruleId?: number, includeEdited?: boolean, dryRun?: boolean }
// Backfills category rules onto every non-removed transaction (or, when
// ruleId is given, tests only that one rule). Returns { matched, changed }.
export async function POST(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  const obj = body as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_FIELDS.has(key)) return Response.json({ error: `Unknown field "${key}".` }, { status: 400 });
  }

  let ruleId: number | undefined;
  if ("ruleId" in obj) {
    if (!isPositiveInt(obj.ruleId)) {
      return Response.json({ error: "ruleId must be a positive integer." }, { status: 400 });
    }
    ruleId = obj.ruleId;
  }

  let includeEdited = false;
  if ("includeEdited" in obj) {
    if (typeof obj.includeEdited !== "boolean") {
      return Response.json({ error: "includeEdited must be a boolean." }, { status: 400 });
    }
    includeEdited = obj.includeEdited;
  }

  let dryRun = false;
  if ("dryRun" in obj) {
    if (typeof obj.dryRun !== "boolean") {
      return Response.json({ error: "dryRun must be a boolean." }, { status: 400 });
    }
    dryRun = obj.dryRun;
  }

  const result = await applyRulesToAllTransactions({ ruleId, includeEdited, dryRun });
  return Response.json(result);
}
