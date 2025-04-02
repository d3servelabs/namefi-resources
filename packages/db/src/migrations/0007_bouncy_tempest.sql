CREATE TYPE "public"."RecordTypeEnum" AS ENUM('A', 'AAAA', 'CNAME', 'MX', 'TXT');--> statement-breakpoint
ALTER TABLE "dns_records" ALTER COLUMN "type" SET DATA TYPE "public"."RecordTypeEnum" USING "type"::"public"."RecordTypeEnum";--> statement-breakpoint
ALTER TABLE "namefi_nft" ALTER COLUMN "as_of_block_number" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "nfsc_payment_details" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_payment_details" jsonb;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "chain_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "wallet_address";