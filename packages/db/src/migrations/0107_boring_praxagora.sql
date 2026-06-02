CREATE SCHEMA "namefi_hunt";
--> statement-breakpoint
ALTER TYPE "public"."hunt_action" SET SCHEMA "namefi_hunt";--> statement-breakpoint
ALTER TYPE "public"."hunt_award_type" SET SCHEMA "namefi_hunt";--> statement-breakpoint
ALTER TYPE "public"."hunt_campaign_status" SET SCHEMA "namefi_hunt";--> statement-breakpoint
ALTER TYPE "public"."hunt_entity_type" SET SCHEMA "namefi_hunt";--> statement-breakpoint
DROP VIEW IF EXISTS "namefi_hunt"."hunt_domain_stats_view";--> statement-breakpoint
ALTER VIEW "public"."hunt_domain_stats_view" SET SCHEMA "namefi_hunt";--> statement-breakpoint
ALTER TABLE "public"."hunt_awards" SET SCHEMA "namefi_hunt";
--> statement-breakpoint
ALTER TABLE "public"."hunt_campaign_domains" SET SCHEMA "namefi_hunt";
--> statement-breakpoint
ALTER TABLE "public"."hunt_campaigns" SET SCHEMA "namefi_hunt";
--> statement-breakpoint
ALTER TABLE "public"."hunt_edges" SET SCHEMA "namefi_hunt";
--> statement-breakpoint
ALTER TABLE "public"."hunt_pinned_domains" SET SCHEMA "namefi_hunt";
--> statement-breakpoint
ALTER TABLE "link_shares" DROP CONSTRAINT "link_shares_campaign_key_hunt_campaigns_campaign_key_fk";
--> statement-breakpoint
ALTER TABLE "link_shares" ADD CONSTRAINT "link_shares_campaign_key_hunt_campaigns_campaign_key_fk" FOREIGN KEY ("campaign_key") REFERENCES "namefi_hunt"."hunt_campaigns"("campaign_key") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
