CREATE TYPE "public"."free_claim_claiming_status" AS ENUM('IDLE', 'CLAIMING', 'CLAIMED');--> statement-breakpoint
CREATE TABLE "free_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_or_campaign_key" text NOT NULL,
	"reason" text,
	"exact_domain_name" text,
	"parent_domain" text,
	"expiration_date" timestamp,
	"order_item_id" uuid,
	"claiming_status" "free_claim_claiming_status" DEFAULT 'IDLE' NOT NULL,
	"claimed_domain_name" text,
	"claimed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "free_claims_user_domain_unique" UNIQUE("user_id","group_or_campaign_key","exact_domain_name"),
	CONSTRAINT "free_claims_claimed_consistency" CHECK (("free_claims"."claiming_status" != 'CLAIMED') OR ("free_claims"."claimed_domain_name" IS NOT NULL AND "free_claims"."claimed_at" IS NOT NULL)),
	CONSTRAINT "free_claims_domain_check" CHECK (("free_claims"."exact_domain_name" IS NOT NULL) OR ("free_claims"."parent_domain" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "free_claims" ADD CONSTRAINT "free_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_claims" ADD CONSTRAINT "free_claims_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "free_claims_user_claim_idx" ON "free_claims" USING btree ("user_id","group_or_campaign_key");--> statement-breakpoint
CREATE INDEX "free_claims_expiration_idx" ON "free_claims" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "free_claims_claiming_status_idx" ON "free_claims" USING btree ("claiming_status");--> statement-breakpoint
CREATE INDEX "free_claims_exact_domain_idx" ON "free_claims" USING btree ("exact_domain_name");--> statement-breakpoint
CREATE INDEX "free_claims_parent_domain_idx" ON "free_claims" USING btree ("parent_domain");--> statement-breakpoint
CREATE INDEX "free_claims_user_domain_status_idx" ON "free_claims" USING btree ("user_id","exact_domain_name","parent_domain","claiming_status","expiration_date");