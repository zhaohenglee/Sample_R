import { requireAuthApi } from "@/lib/auth";
import { budgetReport, upsertBudgets, validateBudgetList, validateMonth } from "@/lib/budgets";
import { ValidationError } from "@/lib/categories";
import { isPgDataError } from "@/lib/pg-errors";

// GET ?month=YYYY-MM -> budgetReport(month)
export async function GET(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  const month = new URL(req.url).searchParams.get("month");
  try {
    const monthIso = validateMonth(month);
    const report = await budgetReport(monthIso);
    return Response.json(report);
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    if (isPgDataError(e)) return Response.json({ error: "invalid value" }, { status: 400 });
    throw e;
  }
}

// PUT { month: "YYYY-MM", items: [{ categoryId, amount: number | null }] }
// Upserts (or, for a null amount, deletes) each item's budget row.
export async function PUT(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const { monthIso, items } = validateBudgetList(body);
    await upsertBudgets(monthIso, items);
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    if (isPgDataError(e)) return Response.json({ error: "invalid value" }, { status: 400 });
    throw e;
  }
}
