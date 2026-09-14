import { requireAuthApi } from "@/lib/auth";
import { createGoal, goalsWithProgress, validateGoalInput } from "@/lib/goals";
import { ValidationError } from "@/lib/categories";

// GET -> every goal with its resolved progress and required monthly
// contribution.
export async function GET() {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const rows = await goalsWithProgress();
  return Response.json(rows);
}

// POST { name, accountId?: number | null, targetAmount, targetDate?: string | null, currentAmount?: number }
export async function POST(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const input = validateGoalInput(body, { partial: false });
    const row = await createGoal(input);
    return Response.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
