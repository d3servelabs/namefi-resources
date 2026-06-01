CREATE TYPE "public"."namefi_feed_ingestion_run_status" AS ENUM('running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."namefi_feed_ingestion_run_trigger" AS ENUM('scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "public"."namefi_feed_listing_report_reason" AS ENUM('already_sold', 'inaccurate_price', 'not_for_sale', 'duplicate_listing', 'other');--> statement-breakpoint
CREATE TYPE "public"."namefi_feed_listing_report_resolution" AS ENUM('suppressed_listing', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."namefi_feed_listing_report_status" AS ENUM('active', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."namefi_feed_post_source" AS ENUM('auto_scan', 'manual');--> statement-breakpoint
CREATE TYPE "public"."namefi_feed_post_status" AS ENUM('pending', 'processing', 'processed', 'skipped', 'failed');--> statement-breakpoint
CREATE TABLE "namefi_feed_ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" text,
	"trigger" "namefi_feed_ingestion_run_trigger" NOT NULL,
	"requested_by_user_id" uuid,
	"status" "namefi_feed_ingestion_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"scanned_post_count" integer DEFAULT 0 NOT NULL,
	"queued_post_count" integer DEFAULT 0 NOT NULL,
	"processed_post_count" integer DEFAULT 0 NOT NULL,
	"listing_upserted_count" integer DEFAULT 0 NOT NULL,
	"skipped_post_count" integer DEFAULT 0 NOT NULL,
	"failed_post_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "namefi_feed_runs_scanned_post_count_nonnegative" CHECK ("namefi_feed_ingestion_runs"."scanned_post_count" >= 0),
	CONSTRAINT "namefi_feed_runs_queued_post_count_nonnegative" CHECK ("namefi_feed_ingestion_runs"."queued_post_count" >= 0),
	CONSTRAINT "namefi_feed_runs_processed_post_count_nonnegative" CHECK ("namefi_feed_ingestion_runs"."processed_post_count" >= 0),
	CONSTRAINT "namefi_feed_runs_listing_upserted_count_nonnegative" CHECK ("namefi_feed_ingestion_runs"."listing_upserted_count" >= 0),
	CONSTRAINT "namefi_feed_runs_skipped_post_count_nonnegative" CHECK ("namefi_feed_ingestion_runs"."skipped_post_count" >= 0),
	CONSTRAINT "namefi_feed_runs_failed_post_count_nonnegative" CHECK ("namefi_feed_ingestion_runs"."failed_post_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "namefi_feed_listing_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reason" "namefi_feed_listing_report_reason" NOT NULL,
	"details" text,
	"status" "namefi_feed_listing_report_status" DEFAULT 'active' NOT NULL,
	"resolution" "namefi_feed_listing_report_resolution",
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "namefi_feed_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"logo" jsonb,
	"asking_price" text,
	"asking_currency" text,
	"purchase_url" text,
	"seller_username" text,
	"seller_display_name" text,
	"source_url" text NOT NULL,
	"message_text" text,
	"listed_at" timestamp DEFAULT now() NOT NULL,
	"posted_at" timestamp NOT NULL,
	"suppressed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "namefi_feed_listings_domain_unique" UNIQUE("domain"),
	CONSTRAINT "namefi_feed_listings_post_domain_unique" UNIQUE("post_id","domain"),
	CONSTRAINT "namefi_feed_listings_domain_lowercase_check" CHECK ("namefi_feed_listings"."domain" = lower("namefi_feed_listings"."domain")),
	CONSTRAINT "namefi_feed_listings_domain_nonempty_check" CHECK (length(trim("namefi_feed_listings"."domain")) > 0)
);
--> statement-breakpoint
CREATE TABLE "namefi_feed_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingestion_run_id" uuid,
	"external_source" text DEFAULT 'x' NOT NULL,
	"external_post_id" text NOT NULL,
	"external_conversation_id" text,
	"external_author_id" text NOT NULL,
	"author_username" text,
	"author_display_name" text,
	"text" text NOT NULL,
	"source" "namefi_feed_post_source" NOT NULL,
	"status" "namefi_feed_post_status" DEFAULT 'pending' NOT NULL,
	"raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"posted_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"failure_reason" text,
	"skip_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "namefi_feed_posts_external_unique" UNIQUE("external_source","external_post_id")
);
--> statement-breakpoint
CREATE TABLE "namefi_feed_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"auto_scan_enabled" boolean DEFAULT false NOT NULL,
	"search_queries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_queries" integer DEFAULT 3 NOT NULL,
	"max_pages_per_query" integer DEFAULT 1 NOT NULL,
	"max_tweets_per_query" integer DEFAULT 10 NOT NULL,
	"max_tweet_age_minutes" integer DEFAULT 1440 NOT NULL,
	"overlap_minutes" integer DEFAULT 5 NOT NULL,
	"last_auto_scan_cursor_at" timestamp,
	"last_run_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "namefi_feed_settings_singleton_id_check" CHECK ("namefi_feed_settings"."id" = 'default'),
	CONSTRAINT "namefi_feed_settings_max_queries_check" CHECK ("namefi_feed_settings"."max_queries" > 0),
	CONSTRAINT "namefi_feed_settings_max_pages_per_query_check" CHECK ("namefi_feed_settings"."max_pages_per_query" > 0),
	CONSTRAINT "namefi_feed_settings_max_tweets_per_query_check" CHECK ("namefi_feed_settings"."max_tweets_per_query" > 0),
	CONSTRAINT "namefi_feed_settings_max_tweet_age_minutes_check" CHECK ("namefi_feed_settings"."max_tweet_age_minutes" > 0),
	CONSTRAINT "namefi_feed_settings_overlap_minutes_check" CHECK ("namefi_feed_settings"."overlap_minutes" >= 0)
);
--> statement-breakpoint
ALTER TABLE "namefi_feed_ingestion_runs" ADD CONSTRAINT "namefi_feed_ingestion_runs_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "namefi_feed_listing_reports" ADD CONSTRAINT "namefi_feed_listing_reports_listing_id_namefi_feed_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."namefi_feed_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "namefi_feed_listings" ADD CONSTRAINT "namefi_feed_listings_post_id_namefi_feed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."namefi_feed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "namefi_feed_posts" ADD CONSTRAINT "namefi_feed_posts_ingestion_run_id_namefi_feed_ingestion_runs_id_fk" FOREIGN KEY ("ingestion_run_id") REFERENCES "public"."namefi_feed_ingestion_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "namefi_feed_runs_workflow_idx" ON "namefi_feed_ingestion_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "namefi_feed_runs_status_started_idx" ON "namefi_feed_ingestion_runs" USING btree ("status","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "namefi_feed_runs_trigger_started_idx" ON "namefi_feed_ingestion_runs" USING btree ("trigger","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "namefi_feed_reports_listing_idx" ON "namefi_feed_listing_reports" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "namefi_feed_reports_status_created_idx" ON "namefi_feed_listing_reports" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_domain_idx" ON "namefi_feed_listings" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_posted_idx" ON "namefi_feed_listings" USING btree ("posted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_listed_idx" ON "namefi_feed_listings" USING btree ("listed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_seller_idx" ON "namefi_feed_listings" USING btree ("seller_username");--> statement-breakpoint
CREATE INDEX "namefi_feed_listings_unsuppressed_idx" ON "namefi_feed_listings" USING btree ("posted_at" DESC NULLS LAST) WHERE "namefi_feed_listings"."suppressed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "namefi_feed_posts_status_created_idx" ON "namefi_feed_posts" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "namefi_feed_posts_run_idx" ON "namefi_feed_posts" USING btree ("ingestion_run_id");--> statement-breakpoint
CREATE INDEX "namefi_feed_posts_author_idx" ON "namefi_feed_posts" USING btree ("external_author_id");--> statement-breakpoint
CREATE INDEX "namefi_feed_posts_posted_idx" ON "namefi_feed_posts" USING btree ("posted_at" DESC NULLS LAST);