ALTER TABLE "transactions" ADD COLUMN "import_hash" text;--> statement-breakpoint
CREATE INDEX "transactions_import_hash_idx" ON "transactions" USING btree ("account_id","import_hash");