ALTER TABLE "accounts" ALTER COLUMN "plaid_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "plaid_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "access_token_enc" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "source" text DEFAULT 'plaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "source" text DEFAULT 'plaid' NOT NULL;