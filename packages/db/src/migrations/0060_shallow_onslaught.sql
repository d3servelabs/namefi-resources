DROP VIEW "public"."domain_tags_with_nft_and_order_items_view";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_payment_id_unique";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_payment_id_payments_id_fk";
--> statement-breakpoint
DROP INDEX "orders_payment_id_idx";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint

UPDATE payments p
SET order_id = o.id
FROM orders o
WHERE o.payment_id = p.id
  AND p.order_id IS NULL; --> statement-breakpoint

ALTER TABLE "orders" DROP COLUMN "payment_id";--> statement-breakpoint
CREATE VIEW "public"."domain_tags_with_nft_and_order_items_view" AS (select "domain_tags"."tag", "namefi_nft"."chain_id", "namefi_nft"."owner_address", "namefi_nft"."as_of_block_number", "order_items"."id", "order_items"."order_id", "order_items"."normalized_domain_name", "order_items"."amount_in_usd_cents", "order_items"."duration_in_years", "order_items"."type", "order_items"."registrar", "order_items"."encryption_key_id", "order_items"."encrypted_epp_authorization_code", "order_items"."status", "order_items"."metadata", "order_items"."created_at", "order_items"."updated_at", orders.status as "order_status", orders.user_id as "order_user_id" from "domain_tags" left join "namefi_nft" on "domain_tags"."normalized_domain_name" = "namefi_nft"."normalized_domain_name" left join "order_items" on "domain_tags"."normalized_domain_name" = "order_items"."normalized_domain_name" left join "orders" on "order_items"."order_id" = "orders"."id" order by "order_items"."created_at" asc, "domain_tags"."normalized_domain_name" asc);