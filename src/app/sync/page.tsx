import { desc, eq } from "drizzle-orm";
import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { itemStatusInfo } from "@/lib/format";
import { SyncButton } from "@/components/SyncButton";

export const dynamic = "force-dynamic";

const LOG_LIMIT = 50;
const ERROR_TRUNCATE = 200;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function formatDuration(startedAt: Date, finishedAt: Date | null): string {
  if (!finishedAt) return "running…";
  const ms = finishedAt.getTime() - startedAt.getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function SyncPage() {
  await requireAuthPage();
  const { syncLog, items } = schema;

  const itemRows = await db.select().from(items).orderBy(items.id);
  const logRows = await db
    .select({
      id: syncLog.id,
      itemId: syncLog.itemId,
      institutionName: items.institutionName,
      startedAt: syncLog.startedAt,
      finishedAt: syncLog.finishedAt,
      added: syncLog.added,
      modified: syncLog.modified,
      removed: syncLog.removed,
      error: syncLog.error,
    })
    .from(syncLog)
    .leftJoin(items, eq(syncLog.itemId, items.id))
    .orderBy(desc(syncLog.startedAt))
    .limit(LOG_LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sync</h1>
        <SyncButton />
      </div>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 text-sm font-medium">Items</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Institution</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Last synced</th>
                <th className="px-4 py-2">Last error</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-gray-500">No banks linked yet.</td>
                </tr>
              )}
              {itemRows.map((item) => {
                const info = itemStatusInfo(item);
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.institutionName ?? "Institution"}</td>
                    <td className={`px-4 py-2 font-medium ${info.needsFix ? "text-red-600" : "text-green-700"}`}>
                      {info.label}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.lastSyncedAt ? item.lastSyncedAt.toLocaleString() : "Never"}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-2 text-gray-600"
                      title={item.lastError ?? undefined}
                    >
                      {item.lastError ? truncate(item.lastError, ERROR_TRUNCATE) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3 text-sm font-medium">Last {LOG_LIMIT} runs</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Institution</th>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2 text-right">Added</th>
                <th className="px-4 py-2 text-right">Modified</th>
                <th className="px-4 py-2 text-right">Removed</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-gray-500">No sync runs yet.</td>
                </tr>
              )}
              {logRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-2">{row.institutionName ?? "Institution"}</td>
                  <td className="px-4 py-2 text-gray-600">{row.startedAt.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-600">{formatDuration(row.startedAt, row.finishedAt)}</td>
                  <td className="px-4 py-2 text-right">{row.added}</td>
                  <td className="px-4 py-2 text-right">{row.modified}</td>
                  <td className="px-4 py-2 text-right">{row.removed}</td>
                  <td
                    className="max-w-xs truncate px-4 py-2 text-red-600"
                    title={row.error ?? undefined}
                  >
                    {row.error ? truncate(row.error, ERROR_TRUNCATE) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
