CREATE TYPE "public"."leadgen_contact_readiness" AS ENUM('not_searched', 'contact_found', 'generic_fallback', 'not_found');--> statement-breakpoint
CREATE TYPE "public"."leadgen_opportunity_status" AS ENUM('checking', 'contact_now', 'validate_first', 'low_priority', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."leadgen_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "leadgen_lead_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"recipe" text NOT NULL,
	"signal_type" text NOT NULL,
	"query" text NOT NULL,
	"evidence_url" text,
	"evidence_snippet" varchar(700) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leadgen_lead_signals_lead_signal_unique" UNIQUE("lead_id","recipe","signal_type","evidence_snippet")
);
--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP CONSTRAINT "leadgen_leads_run_domain_bucket_unique";--> statement-breakpoint
DROP INDEX "leadgen_leads_run_bucket_rank_idx";--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "status" "leadgen_opportunity_status" DEFAULT 'checking' NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "motion" text DEFAULT 'Checking fit' NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "thesis" text DEFAULT 'Checking buyer fit.' NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "risk_level" "leadgen_risk_level" DEFAULT 'low' NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "risk_note" text;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD COLUMN "contact_readiness" "leadgen_contact_readiness" DEFAULT 'not_searched' NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_lead_signals" ADD CONSTRAINT "leadgen_lead_signals_run_id_leadgen_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."leadgen_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_lead_signals" ADD CONSTRAINT "leadgen_lead_signals_lead_id_leadgen_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leadgen_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leadgen_lead_signals_run_lead_idx" ON "leadgen_lead_signals" USING btree ("run_id","lead_id");--> statement-breakpoint
CREATE INDEX "leadgen_leads_run_status_rank_idx" ON "leadgen_leads" USING btree ("run_id","status","rank");--> statement-breakpoint
DELETE FROM "leadgen_leads"
WHERE "id" IN (
	SELECT "id"
	FROM (
		SELECT
			"id",
			row_number() OVER (
				PARTITION BY "run_id", "business_domain"
				ORDER BY "rank" ASC, "created_at" ASC, "id" ASC
			) AS "duplicate_rank"
		FROM "leadgen_leads"
	) "ranked_leadgen_leads"
	WHERE "duplicate_rank" > 1
);--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "bucket";--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD CONSTRAINT "leadgen_leads_run_domain_unique" UNIQUE("run_id","business_domain");--> statement-breakpoint
DROP TYPE "public"."leadgen_bucket";
