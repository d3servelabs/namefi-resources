CREATE TYPE "public"."sales_digest_run_status" AS ENUM('running', 'dry_run', 'sent', 'skipped', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."sales_digest_run_trigger" AS ENUM('scheduled', 'manual');--> statement-breakpoint
CREATE TABLE "sales_digest_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" text,
	"trigger" "sales_digest_run_trigger" NOT NULL,
	"status" "sales_digest_run_status" DEFAULT 'running' NOT NULL,
	"created_by_user_id" uuid,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"entries_count" integer DEFAULT 0 NOT NULL,
	"target_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"include_image" boolean DEFAULT true NOT NULL,
	"include_animation" boolean DEFAULT true NOT NULL,
	"enabled_only" boolean DEFAULT true NOT NULL,
	"dry_run" boolean DEFAULT false NOT NULL,
	"used_fallback" boolean DEFAULT false NOT NULL,
	"fallback_reason" text,
	"skip_reason" text,
	"error_message" text,
	"digest_text_hash" text,
	"image_generated" boolean DEFAULT false NOT NULL,
	"animation_generated" boolean DEFAULT false NOT NULL,
	"target_ids" jsonb DEFAULT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_digest_runs_window_bounds_check" CHECK ("sales_digest_runs"."window_end" >= "sales_digest_runs"."window_start"),
	CONSTRAINT "sales_digest_runs_entries_count_nonnegative" CHECK ("sales_digest_runs"."entries_count" >= 0),
	CONSTRAINT "sales_digest_runs_target_count_nonnegative" CHECK ("sales_digest_runs"."target_count" >= 0),
	CONSTRAINT "sales_digest_runs_sent_count_nonnegative" CHECK ("sales_digest_runs"."sent_count" >= 0),
	CONSTRAINT "sales_digest_runs_skipped_count_nonnegative" CHECK ("sales_digest_runs"."skipped_count" >= 0),
	CONSTRAINT "sales_digest_runs_failed_count_nonnegative" CHECK ("sales_digest_runs"."failed_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sales_digest_target_deliveries" ADD COLUMN "digest_run_id" uuid;--> statement-breakpoint
ALTER TABLE "sales_digest_runs" ADD CONSTRAINT "sales_digest_runs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_digest_runs_status_generated_idx" ON "sales_digest_runs" USING btree ("status","generated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sales_digest_runs_window_idx" ON "sales_digest_runs" USING btree ("window_start","window_end");--> statement-breakpoint
CREATE INDEX "sales_digest_runs_workflow_idx" ON "sales_digest_runs" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "sales_digest_runs_created_by_idx" ON "sales_digest_runs" USING btree ("created_by_user_id");--> statement-breakpoint
ALTER TABLE "sales_digest_target_deliveries" ADD CONSTRAINT "sales_digest_target_deliveries_digest_run_id_sales_digest_runs_id_fk" FOREIGN KEY ("digest_run_id") REFERENCES "public"."sales_digest_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_digest_deliveries_run_created_idx" ON "sales_digest_target_deliveries" USING btree ("digest_run_id","created_at" DESC NULLS LAST);