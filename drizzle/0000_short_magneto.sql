CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"plaid_account_id" text NOT NULL,
	"name" text NOT NULL,
	"official_name" text,
	"mask" text,
	"type" text NOT NULL,
	"subtype" text,
	"current_balance" numeric(14, 2),
	"available_balance" numeric(14, 2),
	"currency" text DEFAULT 'USD',
	"hidden" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_plaid_account_id_unique" UNIQUE("plaid_account_id")
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"month" date NOT NULL,
	"amount" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" integer,
	"plaid_primary" text,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"plaid_item_id" text NOT NULL,
	"institution_id" text,
	"institution_name" text,
	"access_token_enc" text NOT NULL,
	"cursor" text,
	"status" text DEFAULT 'ok' NOT NULL,
	"last_error" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_plaid_item_id_unique" UNIQUE("plaid_item_id")
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"added" integer DEFAULT 0 NOT NULL,
	"modified" integer DEFAULT 0 NOT NULL,
	"removed" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"plaid_transaction_id" text NOT NULL,
	"pending_transaction_id" text,
	"date" date NOT NULL,
	"authorized_date" date,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"name" text NOT NULL,
	"merchant_name" text,
	"plaid_category_primary" text,
	"plaid_category_detailed" text,
	"category_id" integer,
	"notes" text,
	"is_pending" boolean DEFAULT false NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"user_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_plaid_transaction_id_unique" UNIQUE("plaid_transaction_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_category_month_idx" ON "budgets" USING btree ("category_id","month");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_account_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "transactions_pending_idx" ON "transactions" USING btree ("pending_transaction_id");