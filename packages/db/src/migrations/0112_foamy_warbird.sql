ALTER TABLE "namefi_announcements"."announcements" ADD COLUMN "target_sites" text[];--> statement-breakpoint
-- Backfill existing rows from the deprecated single-target column.
UPDATE "namefi_announcements"."announcements"
SET "target_sites" = CASE
	WHEN "target_pbn_domain" IS NULL THEN ARRAY['namefi']
	ELSE ARRAY["target_pbn_domain"]
END
WHERE "target_sites" IS NULL;