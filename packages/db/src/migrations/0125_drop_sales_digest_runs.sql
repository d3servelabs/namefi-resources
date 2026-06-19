ALTER TABLE "sales_digest_target_deliveries" DROP CONSTRAINT "sales_digest_target_deliveries_digest_run_id_sales_digest_runs_id_fk";
--> statement-breakpoint
DROP INDEX "sales_digest_deliveries_run_created_idx";--> statement-breakpoint
ALTER TABLE "sales_digest_target_deliveries" DROP COLUMN "digest_run_id";--> statement-breakpoint
DROP TABLE "sales_digest_runs";--> statement-breakpoint
DROP TYPE "public"."sales_digest_run_status";--> statement-breakpoint
DROP TYPE "public"."sales_digest_run_trigger";
