import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { listRules } from "@/lib/rules";
import { RuleEditor } from "@/components/RuleEditor";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  await requireAuthPage();
  const rules = await listRules();
  const categoryRows = await db.select().from(schema.categories).orderBy(schema.categories.name);
  const accountRows = await db.select().from(schema.accounts).orderBy(schema.accounts.name);

  const categoryOptions = categoryRows.map((c) => ({ id: c.id, name: c.name }));
  const accountOptions = accountRows.map((a) => ({ id: a.id, name: a.nickname ?? a.name }));
  const categoryById = new Map(categoryOptions.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Rules</h1>
      <p className="text-sm text-gray-500">
        Rules run in priority order (lowest first). Applying rules to transactions happens elsewhere; this page only
        manages rule definitions.
      </p>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">New rule</h2>
        <RuleEditor categoryOptions={categoryOptions} accountOptions={accountOptions} />
      </div>

      <div className="space-y-2">
        {rules.length === 0 && (
          <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">No rules yet.</p>
        )}
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border bg-white p-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
              <span>Priority {rule.priority}</span>
              <span>{categoryById.get(rule.categoryId) ?? `Category ${rule.categoryId}`}</span>
            </div>
            <RuleEditor rule={rule} categoryOptions={categoryOptions} accountOptions={accountOptions} />
          </div>
        ))}
      </div>
    </div>
  );
}
