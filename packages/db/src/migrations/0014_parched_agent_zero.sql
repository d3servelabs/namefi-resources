CREATE TABLE "domain_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"tag" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domain_tags_tag_unique" UNIQUE("normalized_domain_name","tag")
);
--> statement-breakpoint
ALTER TABLE "dns_records" ALTER COLUMN "ttl" SET DEFAULT 60;--> statement-breakpoint
CREATE INDEX "domain_tags_tag_idx" ON "domain_tags" USING btree ("tag");--> statement-breakpoint
CREATE VIEW "public"."domain_tags_array_view" AS (select "normalized_domain_name", array_agg("tag") as "tags" from "domain_tags" group by "domain_tags"."normalized_domain_name" order by "domain_tags"."normalized_domain_name" asc);--> statement-breakpoint
CREATE VIEW "public"."domain_tags_with_nft_view" AS (select "domain_tags"."tag", "namefi_nft"."normalized_domain_name", "namefi_nft"."chain_id", "namefi_nft"."as_of_block_number", "namefi_nft"."owner_address" from "domain_tags" left join "namefi_nft" on "domain_tags"."normalized_domain_name" = "namefi_nft"."normalized_domain_name" order by "namefi_nft"."chain_id" asc, "domain_tags"."normalized_domain_name" asc);
CREATE VIEW "public"."domain_tags_with_nft_and_order_items_view" AS (select "domain_tags"."tag", "namefi_nft"."chain_id", "namefi_nft"."owner_address", "namefi_nft"."as_of_block_number", "order_items"."id", "order_items"."order_id", "order_items"."normalized_domain_name", "order_items"."amount_in_usd_cents", "order_items"."status", "order_items"."metadata", "order_items"."created_at", "order_items"."updated_at", orders.status as "order_status", orders.user_id as "order_user_id", orders.payment_id as "order_payment_id" from "domain_tags" left join "namefi_nft" on "domain_tags"."normalized_domain_name" = "namefi_nft"."normalized_domain_name" left join "order_items" on "domain_tags"."normalized_domain_name" = "order_items"."normalized_domain_name" left join "orders" on "order_items"."order_id" = "orders"."id" order by "order_items"."created_at" asc, "domain_tags"."normalized_domain_name" asc);--> statement-breakpoint