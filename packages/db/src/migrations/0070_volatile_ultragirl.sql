CREATE TYPE "public"."domain_export_status" AS ENUM('PENDING_TRANSFER', 'TRANSFER_PERIOD', 'TRANSFER_COMPLETED', 'TRANSFER_FAILED');--> statement-breakpoint
CREATE TABLE "domain_export_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"chain_id" integer NOT NULL,
	"owner_address" text NOT NULL,
	"status" "domain_export_status" NOT NULL,
	"previous_status" "domain_export_status",
	"status_history" jsonb DEFAULT '[]'::jsonb,
	"epp_statuses" jsonb,
	"whois_data" jsonb,
	"registrar_key" text,
	"status_changed_at" timestamp DEFAULT now() NOT NULL,
	"first_detected_at" timestamp DEFAULT now() NOT NULL,
	"last_checked_at" timestamp DEFAULT now() NOT NULL,
	"transfer_completed_at" timestamp,
	"user_notified" boolean DEFAULT false NOT NULL,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domain_export_tracking_domain_chain_unique" UNIQUE("normalized_domain_name","chain_id")
);
--> statement-breakpoint
CREATE INDEX "domain_export_tracking_domain_idx" ON "domain_export_tracking" USING btree ("normalized_domain_name");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_status_idx" ON "domain_export_tracking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_owner_idx" ON "domain_export_tracking" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_chain_idx" ON "domain_export_tracking" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_domain_status_idx" ON "domain_export_tracking" USING btree ("normalized_domain_name","status");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_owner_status_idx" ON "domain_export_tracking" USING btree ("owner_address","status");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_status_changed_idx" ON "domain_export_tracking" USING btree ("status_changed_at");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_last_checked_idx" ON "domain_export_tracking" USING btree ("last_checked_at");--> statement-breakpoint
CREATE INDEX "domain_export_tracking_unnotified_idx" ON "domain_export_tracking" USING btree ("user_notified") WHERE "domain_export_tracking"."user_notified" = false;