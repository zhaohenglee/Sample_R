import { requireAuthApi } from "@/lib/auth";
import { buildBackup } from "@/lib/export";

// GET /api/export/backup.json -- dumps every table for an offline backup.
// buildBackup() (src/lib/export.ts) selects items through an explicit
// column allowlist that omits access_token_enc, so encrypted Plaid access
// tokens never leave the database through this route. See
// tests/export.test.ts for the guard test, which asserts against the whole
// serialized payload rather than one field.
export async function GET() {
  const denied = await requireAuthApi();
  if (denied) return denied;

  const backup = await buildBackup();
  return new Response(JSON.stringify(backup), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="backup.json"',
    },
  });
}
