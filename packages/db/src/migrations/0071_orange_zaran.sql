DROP VIEW IF EXISTS "public"."namefi_nft_with_ai_analysis_view";--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "nameservers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "nameservers_last_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "is_using_namefi_nameservers" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "dnssec_status" jsonb;--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "dnssec_last_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "is_missing_from_registrar" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN IF NOT EXISTS "missing_from_registrar_since" timestamp;
