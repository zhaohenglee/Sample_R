import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { AccountRow } from "@/components/AccountRow";
import { UnlinkButton } from "@/components/UnlinkButton";
import { LinkButton } from "@/components/LinkButton";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await requireAuthPage();
  const { items, accounts } = schema;

  const itemRows = await db.select().from(items).orderBy(items.id);
  const accountRows = await db.select().from(accounts).orderBy(accounts.itemId, accounts.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <LinkButton />
      </div>

      {itemRows.length === 0 && (
        <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">No banks linked yet.</p>
      )}

      <div className="space-y-4">
        {itemRows.map((item) => {
          const itemAccounts = accountRows.filter((a) => a.itemId === item.id);
          const institutionName = item.institutionName ?? "Institution";
          return (
            <div key={item.id} className="rounded-lg border bg-white">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="text-sm">
                  <div className="font-medium">{institutionName}</div>
                  <div className="mt-0.5 text-gray-500">
                    {item.status !== "ok" ? (
                      <span className="text-red-600">
                        {item.status === "login_required" ? "Needs re-login" : item.lastError ?? "Error"}
                      </span>
                    ) : (
                      <span>{item.lastSyncedAt ? `Last synced ${item.lastSyncedAt.toLocaleString()}` : "Not synced yet"}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status !== "ok" && <LinkButton itemId={item.id} label="Fix" />}
                  <UnlinkButton itemId={item.id} institutionName={institutionName} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Account</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2 text-right">Balance</th>
                      <th className="px-4 py-2 text-center">Hidden</th>
                      <th className="px-4 py-2 text-center">Exclude from totals</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-gray-500">
                          No accounts.
                        </td>
                      </tr>
                    )}
                    {itemAccounts.map((a) => (
                      <AccountRow key={a.id} account={a} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
