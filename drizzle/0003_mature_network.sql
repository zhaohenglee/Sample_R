ALTER TABLE "accounts" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "exclude_from_totals" boolean DEFAULT false NOT NULL;