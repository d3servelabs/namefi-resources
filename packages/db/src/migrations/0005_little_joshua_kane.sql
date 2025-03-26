ALTER TABLE "payments" ADD COLUMN "chain_id" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "wallet_address" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "chain_id" integer;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "wallet_address" text;