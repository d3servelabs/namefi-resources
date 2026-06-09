ALTER TYPE "public"."namefi_feed_post_source" ADD VALUE 'system';--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" DROP CONSTRAINT "namefi_feed_listings_domain_unique";--> statement-breakpoint
DROP INDEX "namefi_feed_listings_unsuppressed_idx";--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD COLUMN "end_reason" text;--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_active_domain_posted_idx" ON "namefi_feed_listings" USING btree ("domain","posted_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "namefi_feed_listings"."suppressed_at" IS NULL AND "namefi_feed_listings"."ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_active_expires_idx" ON "namefi_feed_listings" USING btree ("expires_at") WHERE "namefi_feed_listings"."suppressed_at" IS NULL AND "namefi_feed_listings"."ended_at" IS NULL AND "namefi_feed_listings"."expires_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_unsuppressed_idx" ON "namefi_feed_listings" USING btree ("posted_at" DESC NULLS LAST) WHERE "namefi_feed_listings"."suppressed_at" IS NULL AND "namefi_feed_listings"."ended_at" IS NULL;--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD CONSTRAINT "namefi_feed_listings_end_reason_check" CHECK ("namefi_feed_listings"."end_reason" IS NULL OR "namefi_feed_listings"."end_reason" IN ('cancelled', 'expired', 'sold', 'superseded'));--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD CONSTRAINT "namefi_feed_listings_end_state_check" CHECK (("namefi_feed_listings"."ended_at" IS NULL AND "namefi_feed_listings"."end_reason" IS NULL) OR ("namefi_feed_listings"."ended_at" IS NOT NULL AND "namefi_feed_listings"."end_reason" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD CONSTRAINT "namefi_feed_listings_expires_after_listed_check" CHECK ("namefi_feed_listings"."expires_at" IS NULL OR "namefi_feed_listings"."expires_at" > "namefi_feed_listings"."listed_at");
