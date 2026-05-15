CREATE TABLE "order_nfsc_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount_in_usd_cents" integer NOT NULL,
	"nfsc_amount" numeric(38, 18) NOT NULL,
	"recipient_wallet_address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"mint_tx_hash" text,
	"status" "order_status" DEFAULT 'CREATED',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	CONSTRAINT "amount_in_usd_cents_nonnegative" CHECK (amount_in_usd_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "order_nfsc_items" ADD CONSTRAINT "order_nfsc_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_nfsc_items_order_id_idx" ON "order_nfsc_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_nfsc_items_status_idx" ON "order_nfsc_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_nfsc_items_recipient_chain_idx" ON "order_nfsc_items" USING btree ("recipient_wallet_address","chain_id");
