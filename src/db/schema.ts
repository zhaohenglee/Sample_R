import {
  pgTable, serial, text, integer, numeric, boolean, timestamp, date, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  plaidItemId: text("plaid_item_id").notNull().unique(),
  institutionId: text("institution_id"),
  institutionName: text("institution_name"),
  accessTokenEnc: text("access_token_enc").notNull(),
  cursor: text("cursor"),
  status: text("status").notNull().default("ok"), // ok | login_required | error
  lastError: text("last_error"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  plaidAccountId: text("plaid_account_id").notNull().unique(),
  name: text("name").notNull(),
  officialName: text("official_name"),
  mask: text("mask"),
  type: text("type").notNull(),
  subtype: text("subtype"),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }),
  availableBalance: numeric("available_balance", { precision: 14, scale: 2 }),
  currency: text("currency").default("USD"),
  hidden: boolean("hidden").notNull().default(false),
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
    isPending: boolean("is_pending").notNull().default(false),
    isRemoved: boolean("is_removed").notNull().default(false),
    userEdited: boolean("user_edited").notNull().default(false),
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
