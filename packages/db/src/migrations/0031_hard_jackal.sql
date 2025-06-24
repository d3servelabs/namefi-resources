CREATE TYPE "public"."hunt_action" AS ENUM('UPVOTE', 'SUBMIT');--> statement-breakpoint
CREATE TYPE "public"."hunt_entity_type" AS ENUM('USER', 'DOMAIN');--> statement-breakpoint
CREATE TABLE "hunt_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" "hunt_entity_type" NOT NULL,
	"source_id" text NOT NULL,
	"target_type" "hunt_entity_type" NOT NULL,
	"target_id" text NOT NULL,
	"action" "hunt_action" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hunt_edges_user_action_idx" ON "hunt_edges" USING btree ("source_type","source_id","action","created_at");--> statement-breakpoint
CREATE INDEX "hunt_edges_domain_action_idx" ON "hunt_edges" USING btree ("target_type","target_id","action","created_at");--> statement-breakpoint
CREATE INDEX "hunt_edges_user_domain_action_idx" ON "hunt_edges" USING btree ("source_type","source_id","target_type","target_id","action");--> statement-breakpoint
CREATE INDEX "hunt_edges_time_filter_idx" ON "hunt_edges" USING btree ("target_type","action","created_at");--> statement-breakpoint
CREATE VIEW "public"."hunt_domain_stats_view" AS (select "target_id", COUNT(CASE WHEN "action" = 'UPVOTE' THEN 1 END) as "upvote_count", MIN(CASE WHEN "action" = 'SUBMIT' THEN "created_at" END) as "first_submit_date", MAX(CASE WHEN "action" = 'UPVOTE' THEN "created_at" END) as "last_upvote_date" from "hunt_edges" where "hunt_edges"."target_type" = 'DOMAIN' group by "hunt_edges"."target_id");