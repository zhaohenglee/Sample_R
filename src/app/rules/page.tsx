import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { listRules } from "@/lib/rules";
import { RuleEditor, type RulePrefill } from "@/components/RuleEditor";
import { ApplyRulesPanel } from "@/components/ApplyRulesPanel";

export const dynamic = "force-dynamic";

// Next hands repeated query keys (e.g. "?prefill=a&prefill=b") through as an
// array rather than a string.
type Params = {
  prefill?: string | string[];
  field?: string | string[];
  categoryId?: string | string[];
};

const PREFILL_FIELDS = new Set(["name", "merchant_name", "any"]);

// Only the first value of a param is ever meaningful here (a "Create rule
// from this transaction" link only ever sends one), so a repeated key just
// takes its first occurrence rather than being rejected outright.
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RulesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAuthPage();
  const rawSp = await searchParams;
  const sp = { prefill: first(rawSp.prefill), field: first(rawSp.field), categoryId: first(rawSp.categoryId) };
  const rules = await listRules();
  const categoryRows = await db.select().from(schema.categories).orderBy(schema.categories.name);
  const accountRows = await db.select().from(schema.accounts).orderBy(schema.accounts.name);

  const categoryOptions = categoryRows.map((c) => ({ id: c.id, name: c.name }));
  const accountOptions = accountRows.map((a) => ({ id: a.id, name: a.nickname ?? a.name }));
  const categoryById = new Map(categoryOptions.map((c) => [c.id, c.name]));

  // From TransactionRow's "Create rule from this transaction" link. `field`
  // records whether the linked transaction had a merchant name (so the new
  // rule targets the field that can actually match it); default to
  // merchant_name if omitted for a plain link into this page.
  const prefill: RulePrefill | undefined = sp.prefill
    ? {
        field: PREFILL_FIELDS.has(sp.field ?? "") ? (sp.field as RulePrefill["field"]) : "merchant_name",
        match: "contains",
        pattern: sp.prefill,
        categoryId: sp.categoryId,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Rules</h1>
      <p className="text-sm text-gray-500">
        Rules run in priority order (lowest first).
      </p>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">New rule</h2>
        <RuleEditor categoryOptions={categoryOptions} accountOptions={accountOptions} prefill={prefill} />
      </div>

      <ApplyRulesPanel />

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
