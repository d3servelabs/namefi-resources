CREATE TYPE "public"."leadgen_bucket" AS ENUM('general', 'substring');--> statement-breakpoint
CREATE TYPE "public"."leadgen_reasoning_effort" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."leadgen_run_status" AS ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');--> statement-breakpoint
CREATE TABLE "leadgen_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid,
	"business_domain" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"title" text,
	"source_url" text,
	"context" text,
	"notes" text,
	"error_message" text,
	"from_cache" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leadgen_contacts_run_domain_email_unique" UNIQUE("run_id","business_domain","email")
);
--> statement-breakpoint
CREATE TABLE "leadgen_email_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"lead_id" uuid,
	"contact_id" uuid,
	"business_domain" text NOT NULL,
	"contact_email" text NOT NULL,
	"subject" text NOT NULL,
	"full_email" text NOT NULL,
	"from_cache" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leadgen_email_drafts_run_domain_email_unique" UNIQUE("run_id","business_domain","contact_email")
);
--> statement-breakpoint
CREATE TABLE "leadgen_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"stage" text,
	"message" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"transient" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadgen_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"business_domain" text NOT NULL,
	"bucket" "leadgen_bucket" NOT NULL,
	"query" text NOT NULL,
	"rationale" text NOT NULL,
	"content" text NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leadgen_leads_run_domain_bucket_unique" UNIQUE("run_id","business_domain","bucket")
);
--> statement-breakpoint
CREATE TABLE "leadgen_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"status" "leadgen_run_status" DEFAULT 'QUEUED' NOT NULL,
	"reasoning_effort" "leadgen_reasoning_effort" DEFAULT 'medium' NOT NULL,
	"workflow_id" text,
	"error_message" text,
	"summary" text,
	"lead_count" integer DEFAULT 0 NOT NULL,
	"contact_count" integer DEFAULT 0 NOT NULL,
	"draft_count" integer DEFAULT 0 NOT NULL,
	"input" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leadgen_runs_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
ALTER TABLE "leadgen_contacts" ADD CONSTRAINT "leadgen_contacts_run_id_leadgen_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."leadgen_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_contacts" ADD CONSTRAINT "leadgen_contacts_lead_id_leadgen_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leadgen_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" ADD CONSTRAINT "leadgen_email_drafts_run_id_leadgen_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."leadgen_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" ADD CONSTRAINT "leadgen_email_drafts_lead_id_leadgen_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leadgen_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" ADD CONSTRAINT "leadgen_email_drafts_contact_id_leadgen_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."leadgen_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_events" ADD CONSTRAINT "leadgen_events_run_id_leadgen_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."leadgen_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ADD CONSTRAINT "leadgen_leads_run_id_leadgen_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."leadgen_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_runs" ADD CONSTRAINT "leadgen_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leadgen_contacts_run_domain_idx" ON "leadgen_contacts" USING btree ("run_id","business_domain");--> statement-breakpoint
CREATE INDEX "leadgen_email_drafts_run_domain_idx" ON "leadgen_email_drafts" USING btree ("run_id","business_domain");--> statement-breakpoint
CREATE INDEX "leadgen_events_run_created_idx" ON "leadgen_events" USING btree ("run_id","created_at");--> statement-breakpoint
CREATE INDEX "leadgen_leads_run_bucket_rank_idx" ON "leadgen_leads" USING btree ("run_id","bucket","rank");--> statement-breakpoint
CREATE INDEX "leadgen_runs_user_created_idx" ON "leadgen_runs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "leadgen_runs_user_status_idx" ON "leadgen_runs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "leadgen_runs_domain_idx" ON "leadgen_runs" USING btree ("domain");