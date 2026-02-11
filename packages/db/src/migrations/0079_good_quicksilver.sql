DROP VIEW "public"."domain_tags_with_nft_and_order_items_view";--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "refunds" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
CREATE VIEW "public"."domain_tags_with_nft_and_order_items_view" AS (select "domain_tags"."tag", "namefi_nft"."chain_id", "namefi_nft"."owner_address", "namefi_nft"."as_of_block_number", "order_items"."id", "order_items"."order_id", "order_items"."normalized_domain_name", "order_items"."amount_in_usd_cents", "order_items"."duration_in_years", "order_items"."type", "order_items"."registrar", "order_items"."encryption_key_id", "order_items"."encrypted_epp_authorization_code", "order_items"."status", "order_items"."metadata", "order_items"."created_at", "order_items"."updated_at", "order_items"."started_at", "order_items"."finished_at", orders.status as "order_status", orders.user_id as "order_user_id" from "domain_tags" left join "namefi_nft" on "domain_tags"."normalized_domain_name" = "namefi_nft"."normalized_domain_name" left join "order_items" on "domain_tags"."normalized_domain_name" = "order_items"."normalized_domain_name" left join "orders" on "order_items"."order_id" = "orders"."id" order by "order_items"."created_at" asc, "domain_tags"."normalized_domain_name" asc);


UPDATE orders
SET
  started_at = COALESCE(started_at, created_at),
  finished_at = CASE
    WHEN status IN ('SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_COMPLETED')
      THEN COALESCE(finished_at, updated_at)
    ELSE NULL
  END,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{backfilled_started_finished_at}',
    'true'::jsonb,
    true
  )
WHERE
  started_at IS NULL
  OR finished_at IS NULL
  OR (metadata ->> 'backfilled_started_finished_at') IS DISTINCT FROM 'true';--> statement-breakpoint

UPDATE order_items
SET
  started_at = COALESCE(started_at, created_at),
  finished_at = CASE
    WHEN status IN ('SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_COMPLETED')
      THEN COALESCE(finished_at, updated_at)
    ELSE NULL
  END,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{backfilled_started_finished_at}',
    'true'::jsonb,
    true
  )
WHERE
  started_at IS NULL
  OR finished_at IS NULL
  OR (metadata ->> 'backfilled_started_finished_at') IS DISTINCT FROM 'true';--> statement-breakpoint

UPDATE payments
SET
  started_at = COALESCE(started_at, created_at),
  finished_at = CASE
    WHEN status IN ('SUCCEEDED', 'FAILED', 'CANCELLED')
      THEN COALESCE(finished_at, updated_at)
    ELSE NULL
  END
WHERE
  started_at IS NULL
  OR finished_at IS NULL;--> statement-breakpoint

UPDATE refunds
SET
  started_at = COALESCE(started_at, created_at),
  finished_at = CASE
    WHEN status IN ('SUCCEEDED', 'FAILED', 'CANCELLED')
      THEN COALESCE(finished_at, updated_at)
    ELSE NULL
  END
WHERE
  started_at IS NULL
  OR finished_at IS NULL;--> statement-breakpoint
