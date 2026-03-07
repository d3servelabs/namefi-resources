CREATE TYPE "public"."x402_purchase_status" AS ENUM('PENDING_SETTLEMENT', 'PENDING_VERIFICATION', 'VERIFIED', 'PROCESSING', 'SETTLING', 'SETTLED', 'COMPLETED', 'FAILED', 'REFUNDING', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "x402_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"amount_in_usd_cents" integer NOT NULL,
	"buyer_wallet_address" text NOT NULL,
	"network" text NOT NULL,
	"duration_in_years" integer DEFAULT 1 NOT NULL,
	"status" "x402_purchase_status" DEFAULT 'PENDING_SETTLEMENT' NOT NULL,
	"payment_nonce" text NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"payment_payload" jsonb,
	"settlement_tx_hash" text,
	"settled_at" timestamp with time zone,
	"error_message" text,
	"workflow_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "x402_purchases_payment_nonce_unique" UNIQUE("payment_nonce"),
	CONSTRAINT "amount_in_usd_cents_positive" CHECK (amount_in_usd_cents > 0)
);
--> statement-breakpoint
ALTER TABLE "x402_purchases" ADD CONSTRAINT "x402_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "x402_purchases" ADD CONSTRAINT "x402_purchases_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "x402_purchases_buyer_wallet_idx" ON "x402_purchases" USING btree ("buyer_wallet_address");--> statement-breakpoint
CREATE INDEX "x402_purchases_status_idx" ON "x402_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "x402_purchases_user_id_idx" ON "x402_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "x402_purchases_order_id_idx" ON "x402_purchases" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "x402_purchases_domain_idx" ON "x402_purchases" USING btree ("normalized_domain_name");