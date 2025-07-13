CREATE TABLE "hunt_pinned_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_name" text NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hunt_pinned_domains_domain_unique" UNIQUE("domain_name")
);
--> statement-breakpoint
DROP VIEW "public"."hunt_domain_stats_view";--> statement-breakpoint
CREATE INDEX "hunt_pinned_domains_weight_idx" ON "hunt_pinned_domains" USING btree ("weight");--> statement-breakpoint
CREATE VIEW "public"."hunt_domain_stats_view" AS (select "hunt_edges"."target_id", COUNT(CASE WHEN "hunt_edges"."action" = 'UPVOTE' THEN 1 END) as "upvote_count", MIN(CASE WHEN "hunt_edges"."action" = 'SUBMIT' THEN "hunt_edges"."created_at" END) as "first_submit_date", MAX(CASE WHEN "hunt_edges"."action" = 'UPVOTE' THEN "hunt_edges"."created_at" END) as "last_upvote_date", COALESCE("hunt_pinned_domains"."weight", 0) as "pin_weight", CASE WHEN "hunt_pinned_domains"."domain_name" IS NOT NULL THEN true ELSE false END as "is_pinned" from "hunt_edges" left join "hunt_pinned_domains" on "hunt_edges"."target_id" = "hunt_pinned_domains"."domain_name" where "hunt_edges"."target_type" = 'DOMAIN' group by "hunt_edges"."target_id", "hunt_pinned_domains"."weight", "hunt_pinned_domains"."domain_name");