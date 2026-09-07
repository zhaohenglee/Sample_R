import { requireAuthPage } from "@/lib/auth";
import { db, schema } from "@/db";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { CategoryEditor } from "@/components/CategoryEditor";

export const dynamic = "force-dynamic";

const plaidPrimaryOptions = DEFAULT_CATEGORIES.map((c) => c.plaidPrimary);

export default async function CategoriesPage() {
  await requireAuthPage();
  const rows = await db.select().from(schema.categories).orderBy(schema.categories.name);

  const topLevel = rows.filter((c) => c.parentId === null);
  const childrenByParent = new Map<number, typeof rows>();
  for (const c of rows) {
    if (c.parentId !== null) {
      const list = childrenByParent.get(c.parentId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentId, list);
    }
  }
  const parentOptions = topLevel.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Categories</h1>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-700">New category</h2>
        <CategoryEditor parentOptions={parentOptions} plaidPrimaryOptions={plaidPrimaryOptions} />
      </div>

      <div className="space-y-4">
        {topLevel.length === 0 && (
          <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">No categories yet.</p>
        )}
        {topLevel.map((parent) => {
          const children = childrenByParent.get(parent.id) ?? [];
          return (
            <div key={parent.id} className="rounded-lg border bg-white p-4">
              <div className="mb-3 border-b pb-3">
                <CategoryEditor
                  category={parent}
                  parentOptions={parentOptions.filter((o) => o.id !== parent.id)}
                  disableParent={children.length > 0}
                  plaidPrimaryOptions={plaidPrimaryOptions}
                />
              </div>
              <div className="space-y-2 pl-4">
                {children.length === 0 && <p className="text-xs text-gray-400">No subcategories.</p>}
                {children.map((child) => (
                  <CategoryEditor
                    key={child.id}
                    category={child}
                    parentOptions={parentOptions.filter((o) => o.id !== child.id)}
                    plaidPrimaryOptions={plaidPrimaryOptions}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
