import { checkSyncSecret, isAuthed } from "@/lib/auth";
import { syncAllItems } from "@/lib/sync";

// Called by the cron container with Authorization: Bearer SYNC_SECRET,
// or by the logged in user from the UI.
export async function POST(req: Request) {
  if (!checkSyncSecret(req) && !(await isAuthed())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await syncAllItems();
  return Response.json({ results });
}
