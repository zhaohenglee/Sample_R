import { eq, inArray, sql } from "drizzle-orm";
import type { Transaction, RemovedTransaction, AccountBase } from "plaid";
import { db, schema } from "@/db";
import { decrypt } from "./crypto";
import { plaid } from "./plaid";

const { items, accounts, transactions, categories, syncLog } = schema;

export type SyncResult = { itemId: number; added: number; modified: number; removed: number; error?: string };

export async function syncAllItems(): Promise<SyncResult[]> {
  const all = await db.select().from(items);
  const results: SyncResult[] = [];
  for (const item of all) results.push(await syncItem(item.id));
  return results;
}

export async function syncItem(itemId: number): Promise<SyncResult> {
  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) throw new Error(`item ${itemId} not found`);
  const [log] = await db.insert(syncLog).values({ itemId }).returning();
  const accessToken = decrypt(item.accessTokenEnc);

  let cursor = item.cursor ?? undefined;
  let added = 0, modified = 0, removed = 0;

  try {
    // Loop until has_more is false. Cursor is only persisted at the end of a
    // full pass so a crash midway replays the same batch next time.
    for (;;) {
      const res = await plaid.transactionsSync({ access_token: accessToken, cursor, count: 500 });
      const d = res.data;
      await upsertAccounts(item.id, d.accounts);
      await upsertTransactions([...d.added, ...d.modified]);
      await markRemoved(d.removed);
      added += d.added.length; modified += d.modified.length; removed += d.removed.length;
      cursor = d.next_cursor;
      if (!d.has_more) break;
    }

    await db.update(items)
      .set({ cursor, status: "ok", lastError: null, lastSyncedAt: new Date() })
      .where(eq(items.id, item.id));
    await db.update(syncLog).set({ finishedAt: new Date(), added, modified, removed }).where(eq(syncLog.id, log.id));
    return { itemId: item.id, added, modified, removed };
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error_code?: string; error_message?: string } }; message?: string };
    const code = err.response?.data?.error_code;
    const message = err.response?.data?.error_message ?? err.message ?? String(e);
    const status = code === "ITEM_LOGIN_REQUIRED" ? "login_required" : "error";
    await db.update(items).set({ status, lastError: `${code ?? ""} ${message}`.trim() }).where(eq(items.id, item.id));
    await db.update(syncLog).set({ finishedAt: new Date(), added, modified, removed, error: message }).where(eq(syncLog.id, log.id));
    return { itemId: item.id, added, modified, removed, error: message };
  }
}

export async function upsertAccounts(itemId: number, list: AccountBase[]) {
  for (const a of list) {
    await db.insert(accounts).values({
      itemId,
      plaidAccountId: a.account_id,
      name: a.name,
      officialName: a.official_name ?? null,
      mask: a.mask ?? null,
      type: a.type,
      subtype: a.subtype ?? null,
      currentBalance: a.balances.current?.toString() ?? null,
      availableBalance: a.balances.available?.toString() ?? null,
      currency: a.balances.iso_currency_code ?? "USD",
    }).onConflictDoUpdate({
      target: accounts.plaidAccountId,
      set: {
        name: a.name,
        officialName: a.official_name ?? null,
        currentBalance: a.balances.current?.toString() ?? null,
        availableBalance: a.balances.available?.toString() ?? null,
        updatedAt: new Date(),
      },
    });
  }
}

export async function upsertTransactions(list: Transaction[]) {
  if (list.length === 0) return;
  const accountRows = await db.select({ id: accounts.id, plaidAccountId: accounts.plaidAccountId }).from(accounts);
  const accountMap = new Map(accountRows.map((r) => [r.plaidAccountId, r.id]));
  const categoryRows = await db.select({ id: categories.id, plaidPrimary: categories.plaidPrimary }).from(categories);
  const categoryMap = new Map(categoryRows.filter((c) => c.plaidPrimary).map((c) => [c.plaidPrimary!, c.id]));

  for (const t of list) {
    const accountId = accountMap.get(t.account_id);
    if (!accountId) continue;
    const primary = t.personal_finance_category?.primary ?? null;
    const detailed = t.personal_finance_category?.detailed ?? null;

    // If this posted transaction replaces a pending one we already stored,
    // carry over any manual edits from the pending row.
    let inherited: { categoryId: number | null; notes: string | null; userEdited: boolean } | null = null;
    if (t.pending_transaction_id) {
      const [prev] = await db.select({ categoryId: transactions.categoryId, notes: transactions.notes, userEdited: transactions.userEdited })
        .from(transactions).where(eq(transactions.plaidTransactionId, t.pending_transaction_id));
      if (prev?.userEdited) inherited = prev;
    }

    const base = {
      accountId,
      plaidTransactionId: t.transaction_id,
      pendingTransactionId: t.pending_transaction_id ?? null,
      date: t.date,
      authorizedDate: t.authorized_date ?? null,
      amount: t.amount.toString(),
      currency: t.iso_currency_code ?? "USD",
      name: t.name,
      merchantName: t.merchant_name ?? null,
      plaidCategoryPrimary: primary,
      plaidCategoryDetailed: detailed,
      isPending: t.pending,
      isRemoved: false,
      updatedAt: new Date(),
    };

    await db.insert(transactions).values({
      ...base,
      categoryId: inherited?.categoryId ?? (primary ? categoryMap.get(primary) ?? null : null),
      notes: inherited?.notes ?? null,
      userEdited: inherited?.userEdited ?? false,
    }).onConflictDoUpdate({
      target: transactions.plaidTransactionId,
      // Never overwrite category or notes: those are user owned once set.
      set: {
        ...base,
        categoryId: sql`CASE WHEN ${transactions.userEdited} THEN ${transactions.categoryId} ELSE ${primary ? categoryMap.get(primary) ?? null : null} END`,
      },
    });
  }
}

export async function markRemoved(list: RemovedTransaction[]) {
  const ids = list.map((r) => r.transaction_id).filter((x): x is string => !!x);
  if (ids.length === 0) return;
  await db.update(transactions).set({ isRemoved: true, updatedAt: new Date() }).where(inArray(transactions.plaidTransactionId, ids));
}
