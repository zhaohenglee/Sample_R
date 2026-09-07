import { requireAuthApi } from "@/lib/auth";
import { copyBudgets, validateMonth } from "@/lib/budgets";
import { ValidationError } from "@/lib/categories";

const ALLOWED_FIELDS = new Set(["from", "to", "overwrite"]);

// POST { from: "YYYY-MM", to: "YYYY-MM", overwrite?: boolean }
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

  try {
    if (!("from" in obj)) throw new ValidationError("from is required.");
    if (!("to" in obj)) throw new ValidationError("to is required.");
    const fromIso = validateMonth(obj.from);
    const toIso = validateMonth(obj.to);

    let overwrite = false;
    if ("overwrite" in obj) {
      if (typeof obj.overwrite !== "boolean") throw new ValidationError("overwrite must be a boolean.");
      overwrite = obj.overwrite;
    }

    const copied = await copyBudgets(fromIso, toIso, { overwrite });
    return Response.json({ copied });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
