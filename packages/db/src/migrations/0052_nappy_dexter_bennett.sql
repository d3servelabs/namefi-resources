CREATE TYPE "public"."link_type" AS ENUM('twitter');--> statement-breakpoint
ALTER TABLE "link_shares" ADD COLUMN "external_identifier" text;--> statement-breakpoint
-- Add as nullable first to avoid failing on existing rows
ALTER TABLE "link_shares" ADD COLUMN "type" "link_type";--> statement-breakpoint
-- Backfill existing rows to default 'twitter'
UPDATE "link_shares" SET "type" = 'twitter' WHERE "type" IS NULL;--> statement-breakpoint
-- Now enforce NOT NULL
ALTER TABLE "link_shares" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "link_shares" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;