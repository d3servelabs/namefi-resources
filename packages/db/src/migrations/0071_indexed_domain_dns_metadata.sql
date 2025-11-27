ALTER TABLE "indexed_domains" ADD COLUMN "nameservers" jsonb NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN "nameservers_last_updated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN "is_using_namefi_nameservers" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN "dnssec_status" jsonb;
--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN "dnssec_last_updated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN "is_missing_from_registrar" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "indexed_domains" ADD COLUMN "missing_from_registrar_since" timestamp;


