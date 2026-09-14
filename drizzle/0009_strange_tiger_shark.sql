ALTER TABLE "accounts" ADD COLUMN "starting_balance" numeric(14, 2);
--> statement-breakpoint
-- Manual accounts created before this migration have no starting_balance.
-- recomputeManualBalance treats NULL as 0, so without this backfill the
-- first later transaction would silently reset the opening balance to 0.
UPDATE "accounts" SET "starting_balance" = "current_balance"
  WHERE "source" <> 'plaid' AND "starting_balance" IS NULL;
