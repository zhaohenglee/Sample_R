import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ImportWizard } from "@/components/ImportWizard";

export const dynamic = "force-dynamic";

// CSV rows land in a manual account: a Plaid account's rows are owned by
// the sync path, so importing into one would create duplicates the next
// time that bank refreshed.
export default async function ImportPage() {
  const { accounts } = schema;
  const manualAccounts = await db
    .select({ id: accounts.id, name: accounts.name, mask: accounts.mask })
    .from(accounts)
    .where(eq(accounts.source, "manual"))
    .orderBy(accounts.name);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import CSV</h1>
      <p className="text-sm text-gray-600">
        Load history from a bank Plaid cannot reach, or from before you linked an account.
        Re-importing the same file is safe: rows already present are skipped.
      </p>
      <ImportWizard accounts={manualAccounts} />
    </div>
  );
}
