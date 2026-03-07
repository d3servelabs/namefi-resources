ALTER TYPE "public"."payment_provider" ADD VALUE 'X402';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "x402_payment_details" jsonb;