ALTER TABLE "hunt_campaigns" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "hunt_campaigns" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "hunt_campaigns" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hunt_campaign_domains" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "hunt_campaigns" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "hunt_campaigns" ADD COLUMN "logo_url" text DEFAULT '' NOT NULL;