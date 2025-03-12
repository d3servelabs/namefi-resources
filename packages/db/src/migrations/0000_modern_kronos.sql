CREATE TYPE "public"."order_status" AS ENUM('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('NFSC_BASE', 'NFSC_ETHEREUM', 'NFSC_ETHEREUM_SEPOLIA', 'STRIPE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUND_SUCCEEDED');--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"amount_in_usd_cents" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amount_in_usd_cents_nonnegative" CHECK (amount_in_usd_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_id_idx" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"amount_in_usd_cents" integer NOT NULL,
	"status" "order_status" DEFAULT 'CREATED',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amount_in_usd_cents_nonnegative" CHECK (amount_in_usd_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"status" "order_status" DEFAULT 'CREATED' NOT NULL,
	"payment_id" uuid,
	"amount_in_usd_cents" integer NOT NULL,
	"total_amount_in_usd_cents" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_payment_id_unique" UNIQUE("payment_id"),
	CONSTRAINT "amount_in_usd_cents_nonnegative" CHECK (amount_in_usd_cents >= 0),
	CONSTRAINT "total_amount_in_usd_cents_nonnegative" CHECK (total_amount_in_usd_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount_in_usd_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'CREATED' NOT NULL,
	"payment_provider" "payment_provider",
	"payment_provider_reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_reference_unique" UNIQUE("payment_provider_reference_id"),
	CONSTRAINT "amount_in_usd_cents_nonnegative" CHECK (amount_in_usd_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_in_usd_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'CREATED' NOT NULL,
	"payment_provider_reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_provider_reference_unique" UNIQUE("payment_provider_reference_id"),
	CONSTRAINT "amount_in_usd_cents_nonnegative" CHECK (amount_in_usd_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_primary_email_unique" UNIQUE("primary_email")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_user_id_idx" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_status_idx" ON "order_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_payment_id_idx" ON "orders" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");