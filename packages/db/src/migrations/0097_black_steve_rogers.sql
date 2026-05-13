CREATE TABLE "email_campaign_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_key" text NOT NULL,
	"group_identifier" text DEFAULT '' NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_campaign_clicks_campaign_group_unique" UNIQUE("campaign_key","group_identifier"),
	CONSTRAINT "email_campaign_clicks_click_count_nonnegative" CHECK (click_count >= 0),
	CONSTRAINT "email_campaign_clicks_campaign_key_nonempty" CHECK (length(trim(campaign_key)) > 0)
);
--> statement-breakpoint
CREATE TABLE "email_campaign_opens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_key" text NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_campaign_opens_campaign_key_unique" UNIQUE("campaign_key"),
	CONSTRAINT "email_campaign_opens_open_count_nonnegative" CHECK (open_count >= 0),
	CONSTRAINT "email_campaign_opens_campaign_key_nonempty" CHECK (length(trim(campaign_key)) > 0)
);
