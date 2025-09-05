ALTER TABLE "orders" DROP CONSTRAINT "total_amount_in_usd_cents_nonnegative";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "total_amount_in_usd_cents";