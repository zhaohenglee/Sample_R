CREATE TABLE "recurring" (
	"id" serial PRIMARY KEY NOT NULL,
	"merchant_key" text NOT NULL,
	"display_name" text NOT NULL,
	"cadence" text NOT NULL,
	"expected_amount" numeric(14, 2) NOT NULL,
	"last_date" date NOT NULL,
	"next_due" date NOT NULL,
	"occurrences" integer NOT NULL,
	"account_id" integer NOT NULL,
	"category_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring" ADD CONSTRAINT "recurring_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring" ADD CONSTRAINT "recurring_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_merchant_account_idx" ON "recurring" USING btree ("merchant_key","account_id");