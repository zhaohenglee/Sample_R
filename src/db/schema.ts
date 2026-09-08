import {
  pgTable, serial, text, integer, numeric, boolean, timestamp, date, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  // Null for a manual item (see accounts.source below) -- Postgres allows
  // many nulls under a unique index, so the constraint still holds for
  // Plaid items, which always have one.
  plaidItemId: text("plaid_item_id").unique(),
  institutionId: text("institution_id"),
  institutionName: text("institution_name"),
  // Null for a manual item. Always non-null together with plaidItemId --
  // there is no state with one set and not the other.
  accessTokenEnc: text("access_token_enc"),
  cursor: text("cursor"),
  status: text("status").notNull().default("ok"), // ok | login_required | pending_expiration | new_accounts_available | revoked | error
  lastError: text("last_error"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  // Null for a manual account, same reasoning as items.plaidItemId above.
  plaidAccountId: text("plaid_account_id").unique(),
  name: text("name").notNull(),
  officialName: text("official_name"),
  mask: text("mask"),
  type: text("type").notNull(),
  subtype: text("subtype"),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }),
  availableBalance: numeric("available_balance", { precision: 14, scale: 2 }),
  currency: text("currency").default("USD"),
  hidden: boolean("hidden").notNull().default(false),
  nickname: text("nickname"),
  excludeFromTotals: boolean("exclude_from_totals").notNull().default(false),
  source: text("source").notNull().default("plaid"), // plaid | manual | csv
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    parentId: integer("parent_id"),
    plaidPrimary: text("plaid_primary"), // default mapping from Plaid PFC primary
  },
  (t) => [
    uniqueIndex("categories_plaid_primary_idx").on(t.plaidPrimary).where(sql`${t.plaidPrimary} is not null`),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    // Stays not-null and unique regardless of source: manual and imported
    // rows get a synthetic id ("manual:<uuid>" / "csv:<uuid>") so the sync
    // upsert logic (which targets this column) is untouched.
    plaidTransactionId: text("plaid_transaction_id").notNull().unique(),
    pendingTransactionId: text("pending_transaction_id"),
    date: date("date").notNull(),
    authorizedDate: date("authorized_date"),
    // Plaid convention: positive = money out, negative = money in.
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").default("USD"),
    name: text("name").notNull(),
    merchantName: text("merchant_name"),
    displayName: text("display_name"),
    plaidCategoryPrimary: text("plaid_category_primary"),
    plaidCategoryDetailed: text("plaid_category_detailed"),
    categoryId: integer("category_id").references(() => categories.id),
    notes: text("notes"),
    ruleId: integer("rule_id").references(() => categoryRules.id, { onDelete: "set null" }),
    isPending: boolean("is_pending").notNull().default(false),
    isRemoved: boolean("is_removed").notNull().default(false),
    userEdited: boolean("user_edited").notNull().default(false),
    source: text("source").notNull().default("plaid"), // plaid | manual | csv
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("transactions_date_idx").on(t.date),
    index("transactions_account_idx").on(t.accountId),
    index("transactions_pending_idx").on(t.pendingTransactionId),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    month: date("month").notNull(), // first day of month
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [uniqueIndex("budgets_category_month_idx").on(t.categoryId, t.month)],
);

export const categoryRules = pgTable(
  "category_rules",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    field: text("field").notNull(), // name | merchant_name | any
    match: text("match").notNull(), // contains | starts_with | regex
    pattern: text("pattern").notNull(),
    amountMin: numeric("amount_min", { precision: 14, scale: 2 }),
    amountMax: numeric("amount_max", { precision: 14, scale: 2 }),
    accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
    categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    setDisplayName: text("set_display_name"),
    priority: integer("priority").notNull().default(100),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("category_rules_priority_idx").on(t.priority),
  ],
);

export const balanceSnapshots = pgTable(
  "balance_snapshots",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    current: numeric("current", { precision: 14, scale: 2 }),
    available: numeric("available", { precision: 14, scale: 2 }),
  },
  (t) => [uniqueIndex("balance_snapshots_account_date_idx").on(t.accountId, t.date)],
);

export const recurring = pgTable(
  "recurring",
  {
    id: serial("id").primaryKey(),
    merchantKey: text("merchant_key").notNull(),
    displayName: text("display_name").notNull(),
    cadence: text("cadence").notNull(), // weekly | monthly | yearly
    expectedAmount: numeric("expected_amount", { precision: 14, scale: 2 }).notNull(),
    lastDate: date("last_date").notNull(),
    nextDue: date("next_due").notNull(),
    occurrences: integer("occurrences").notNull(),
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("recurring_merchant_account_idx").on(t.merchantKey, t.accountId)],
);

export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  added: integer("added").notNull().default(0),
  modified: integer("modified").notNull().default(0),
  removed: integer("removed").notNull().default(0),
  error: text("error"),
});
