CREATE TABLE "category_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"field" text NOT NULL,
	"match" text NOT NULL,
	"pattern" text NOT NULL,
	"amount_min" numeric(14, 2),
	"amount_max" numeric(14, 2),
	"account_id" integer,
	"category_id" integer NOT NULL,
	"set_display_name" text,
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_rules_priority_idx" ON "category_rules" USING btree ("priority");