CREATE TYPE "public"."hunt_award_type" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CAMPAIGN');--> statement-breakpoint
CREATE TYPE "public"."hunt_campaign_status" AS ENUM('DRAFT', 'ACTIVE', 'ENDED', 'AWARDED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "hunt_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_name" text NOT NULL,
	"type" "hunt_award_type" NOT NULL,
	"campaign_key" text,
	"period_key" text,
	"rank" integer NOT NULL,
	"reason" text,
	"upvote_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hunt_awards_key_check" CHECK (("hunt_awards"."campaign_key" IS NOT NULL) OR ("hunt_awards"."period_key" IS NOT NULL)),
	CONSTRAINT "hunt_awards_rank_positive" CHECK ("hunt_awards"."rank" > 0),
	CONSTRAINT "hunt_awards_upvote_count_nonnegative" CHECK ("hunt_awards"."upvote_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hunt_campaign_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_key" text NOT NULL,
	"domain_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hunt_campaign_domains_unique" UNIQUE("campaign_key","domain_name")
);
--> statement-breakpoint
CREATE TABLE "hunt_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "hunt_campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hunt_campaigns_campaign_key_unique" UNIQUE("campaign_key"),
	CONSTRAINT "hunt_campaigns_dates_valid" CHECK ("hunt_campaigns"."end_date" > "hunt_campaigns"."start_date")
);
--> statement-breakpoint
ALTER TABLE "hunt_pinned_domains" ALTER COLUMN "weight" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "hunt_campaign_domains" ADD CONSTRAINT "hunt_campaign_domains_campaign_key_hunt_campaigns_campaign_key_fk" FOREIGN KEY ("campaign_key") REFERENCES "public"."hunt_campaigns"("campaign_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hunt_awards_domain_idx" ON "hunt_awards" USING btree ("domain_name");--> statement-breakpoint
CREATE INDEX "hunt_awards_type_period_idx" ON "hunt_awards" USING btree ("type","period_key");--> statement-breakpoint
CREATE INDEX "hunt_awards_campaign_idx" ON "hunt_awards" USING btree ("campaign_key");--> statement-breakpoint
CREATE INDEX "hunt_campaign_domains_campaign_idx" ON "hunt_campaign_domains" USING btree ("campaign_key");--> statement-breakpoint
CREATE INDEX "hunt_campaign_domains_domain_idx" ON "hunt_campaign_domains" USING btree ("domain_name");--> statement-breakpoint
CREATE INDEX "hunt_campaigns_dates_idx" ON "hunt_campaigns" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "hunt_campaigns_status_idx" ON "hunt_campaigns" USING btree ("status");