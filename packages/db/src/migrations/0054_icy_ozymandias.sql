-- Create campaign limits table with source-specific limits support

CREATE TABLE "free_claim_campaign_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_key" text NOT NULL,
	"parent_domain" text NOT NULL,
	"source" text,
	"max_claims_per_user" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,

    -- Unique constraint: one limit rule per (campaign, domain, source) combination
	CONSTRAINT "unique_campaign_domain_source" UNIQUE("campaign_key","parent_domain","source")
);