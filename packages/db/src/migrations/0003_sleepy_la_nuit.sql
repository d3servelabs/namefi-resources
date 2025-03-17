ALTER TABLE "payments" ALTER COLUMN "payment_provider" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "public"."payments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."payment_status" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."refund_status" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUND_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REQUIRES_ACTION');--> statement-breakpoint
ALTER TABLE "public"."payments" ALTER COLUMN "status" SET DATA TYPE "public"."payment_status" USING "status"::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "status" SET DEFAULT 'CREATED'::refund_status;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "status" SET DATA TYPE refund_status USING status::refund_status;