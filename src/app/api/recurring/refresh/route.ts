import { requireAuthApi } from "@/lib/auth";
import { refreshRecurring } from "@/lib/recurring";

// POST -- re-runs recurring detection over all visible accounts' recent
// transactions and replaces the `recurring` table. No body fields accepted.
export async function POST(req: Request) {
  const denied = await requireAuthApi();
  if (denied) return denied;

  let body: unknown = {};
  const text = await req.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  if (Object.keys(body as Record<string, unknown>).length > 0) {
    return Response.json({ error: "This endpoint takes no fields." }, { status: 400 });
  }

  const count = await refreshRecurring();
  return Response.json({ count });
}
