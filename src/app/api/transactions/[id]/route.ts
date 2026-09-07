import { eq } from "drizzle-orm";
import { requireAuthApi } from "@/lib/auth";
import { db, schema } from "@/db";

// PATCH { categoryId?: number | null, notes?: string | null }
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAuthApi();
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = await req.json();
  const set: Partial<typeof schema.transactions.$inferInsert> = { userEdited: true, updatedAt: new Date() };
  if ("categoryId" in body) set.categoryId = body.categoryId === null ? null : Number(body.categoryId);
  if ("notes" in body) set.notes = body.notes ?? null;
  const [row] = await db.update(schema.transactions).set(set).where(eq(schema.transactions.id, Number(id))).returning();
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(row);
}
