import { eq, inArray, sql } from "drizzle-orm";
import type { Transaction, RemovedTransaction, AccountBase } from "plaid";
import { db, schema } from "@/db";
import { decrypt } from "./crypto";
import { plaid } from "./plaid";
import { applyRulesToTransactions } from "./rules";
import { currentDateIso } from "./reports";
import { refreshRecurring } from "./recurring";

const { items, accounts, transactions, categories, syncLog, balanceSnapshots } = schema;

export type SyncResult = { itemId: number; added: number; modified: number; removed: number; error?: string };

export async function syncAllItems(): Promise<SyncResult[]> {
  const all = await db.select().from(items);
  const results: SyncResult[] = [];
  for (const item of all) results.push(await syncItem(item.id));

  // Runs once per batch, not per item -- recurring detection scans all
  // accounts anyway, so re-running it after each item would be wasted
  // work. A detection failure must never fail the sync it rides along
  // with, so it's isolated behind its own try/catch.
  try {
    await refreshRecurring();
  } catch (e) {
    console.error("refreshRecurring failed after syncAllItems", e);
  }

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

    await writeBalanceSnapshots(item.id);

    // A successful sync clears an error/login_required status, but must not
    // clobber a status set by a webhook that still needs the user to act
    // (pending_expiration, new_accounts_available, revoked) -- those persist
    // until the user re-links, even though syncing itself keeps working.
    const resetStatus = item.status === "login_required" || item.status === "error";
    await db.update(items)
      .set({
        cursor,
        lastSyncedAt: new Date(),
        ...(resetStatus ? { status: "ok", lastError: null } : {}),
      })
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

// Writes one balance_snapshots row per account belonging to `itemId`, dated
// today (local date), using each account's balances as currently stored
// (already refreshed by upsertAccounts earlier in this sync pass). Upserts
// on (account_id, date) so re-running a sync later the same day updates the
// existing row instead of creating a duplicate.
export async function writeBalanceSnapshots(itemId: number): Promise<void> {
  const dateIso = currentDateIso();
  const accountRows = await db
    .select({ id: accounts.id, currentBalance: accounts.currentBalance, availableBalance: accounts.availableBalance })
    .from(accounts)
    .where(eq(accounts.itemId, itemId));
  if (accountRows.length === 0) return;

  for (const a of accountRows) {
    await db.insert(balanceSnapshots).values({
      accountId: a.id,
      date: dateIso,
      current: a.currentBalance,
      available: a.availableBalance,
    }).onConflictDoUpdate({
      target: [balanceSnapshots.accountId, balanceSnapshots.date],
      set: { current: a.currentBalance, available: a.availableBalance },
    });
  }
}

export async function upsertTransactions(list: Transaction[]) {
  if (list.length === 0) return;
  const accountRows = await db.select({ id: accounts.id, plaidAccountId: accounts.plaidAccountId }).from(accounts);
  const accountMap = new Map(accountRows.map((r) => [r.plaidAccountId, r.id]));
  const categoryRows = await db.select({ id: categories.id, plaidPrimary: categories.plaidPrimary }).from(categories);
  const categoryMap = new Map(categoryRows.filter((c) => c.plaidPrimary).map((c) => [c.plaidPrimary!, c.id]));

  // Snapshot which of these plaid_transaction_ids already have a row before
  // the upsert loop runs, so afterwards we can tell which ones the loop
  // actually inserted (as opposed to merely updated). Rules only ever run
  // against genuinely new rows -- never against modified ones.
  const plaidIds = list.map((t) => t.transaction_id);
  const existingRows = await db
    .select({ plaidTransactionId: transactions.plaidTransactionId })
    .from(transactions)
    .where(inArray(transactions.plaidTransactionId, plaidIds));
  const existedBefore = new Set(existingRows.map((r) => r.plaidTransactionId));

  for (const t of list) {
    const accountId = accountMap.get(t.account_id);
    if (!accountId) continue;
    const primary = t.personal_finance_category?.primary ?? null;
    const detailed = t.personal_finance_category?.detailed ?? null;

    // If this posted transaction replaces a pending one we already stored,
    // carry over any manual edits from the pending row.
    let inherited: { categoryId: number | null; notes: string | null; displayName: string | null; userEdited: boolean } | null = null;
    if (t.pending_transaction_id) {
      const [prev] = await db.select({
        categoryId: transactions.categoryId,
        notes: transactions.notes,
        displayName: transactions.displayName,
        userEdited: transactions.userEdited,
      }).from(transactions).where(eq(transactions.plaidTransactionId, t.pending_transaction_id));
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

    // Presence semantics: when a user-edited pending row exists, copy its
    // categoryId/notes/displayName exactly as stored -- including an
    // explicit null -- rather than falling back to the Plaid default via
    // `??` (which would turn a deliberate "no category" back into one).
    const plaidCategoryId = primary ? categoryMap.get(primary) ?? null : null;
    await db.insert(transactions).values({
      ...base,
      categoryId: inherited ? inherited.categoryId : plaidCategoryId,
      notes: inherited ? inherited.notes : null,
      displayName: inherited ? inherited.displayName : null,
      userEdited: inherited ? true : false,
    }).onConflictDoUpdate({
      target: transactions.plaidTransactionId,
      // Never overwrite category, notes, or display_name: those are user
      // owned once set (display_name is deliberately absent from `base`).
      // A rule-assigned category is owned the same way: once rule_id is set
      // on a row, a later modified-sync (which never re-runs rules -- see
      // applyRulesToTransactions below) must not silently fall back to the
      // Plaid default and erase it. rule_id itself is intentionally absent
      // from `set`/`base`, so it is left untouched by this update either way.
      set: {
        ...base,
        categoryId: sql`CASE WHEN ${transactions.userEdited} OR ${transactions.ruleId} IS NOT NULL THEN ${transactions.categoryId} ELSE ${primary ? categoryMap.get(primary) ?? null : null} END`,
      },
    });
  }

  // Run category rules once, only against rows this call actually inserted
  // (never against rows it merely updated). A row inheriting a user edit
  // from a pending predecessor is user_edited=true and so is skipped by
  // applyRulesToTransactions automatically (includeEdited defaults to off).
  const newPlaidIds = list.map((t) => t.transaction_id).filter((id) => !existedBefore.has(id));
  if (newPlaidIds.length > 0) {
    const newRows = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(inArray(transactions.plaidTransactionId, newPlaidIds));
    if (newRows.length > 0) await applyRulesToTransactions(newRows.map((r) => r.id), {});
  }
}

export async function markRemoved(list: RemovedTransaction[]) {
  const ids = list.map((r) => r.transaction_id).filter((x): x is string => !!x);
  if (ids.length === 0) return;
  await db.update(transactions).set({ isRemoved: true, updatedAt: new Date() }).where(inArray(transactions.plaidTransactionId, ids));
}
