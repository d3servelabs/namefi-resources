CREATE TYPE "public"."dnsviz_analysis_status" AS ENUM('SECURE', 'INSECURE', 'BOGUS', 'ERROR');--> statement-breakpoint
CREATE TABLE "dnsviz_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"registrar_key" text NOT NULL,
	"analysis_date" date NOT NULL,
	"analysis_started_at" timestamp DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"status" "dnsviz_analysis_status" NOT NULL,
	"errors_count" integer DEFAULT 0 NOT NULL,
	"warnings_count" integer DEFAULT 0 NOT NULL,
	"summary" jsonb,
	"probe_data" jsonb,
	"grok_data" jsonb,
	"error_message" text,
	"workflow_run_id" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dnsviz_analyses_domain_date_unique" UNIQUE("normalized_domain_name","analysis_date")
);
--> statement-breakpoint
CREATE INDEX "dnsviz_analyses_domain_date_idx" ON "dnsviz_analyses" USING btree ("normalized_domain_name","analysis_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "dnsviz_analyses_analysis_date_idx" ON "dnsviz_analyses" USING btree ("analysis_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "dnsviz_analyses_status_idx" ON "dnsviz_analyses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dnsviz_analyses_expires_at_idx" ON "dnsviz_analyses" USING btree ("expires_at");