import { requireAuthApi } from "@/lib/auth";
import {
  createCategory,
  listCategories,
  validateCategoryInput,
  InvalidParentError,
  NameConflictError,
  PlaidPrimaryConflictError,
  ValidationError,
} from "@/lib/categories";

export async function GET() {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const rows = await listCategories();
  return Response.json(rows);
}

// POST { name: string, parentId?: number | null, plaidPrimary?: string | null }
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
    const input = validateCategoryInput(body, { partial: false });
    const row = await createCategory(input);
    return Response.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof PlaidPrimaryConflictError || e instanceof NameConflictError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof ValidationError || e instanceof InvalidParentError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
