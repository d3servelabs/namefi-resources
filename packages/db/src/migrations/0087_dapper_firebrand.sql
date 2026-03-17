ALTER TABLE "domain_export_tracking" ADD COLUMN "latest_evidence" jsonb;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "pending_notified_at" timestamp;