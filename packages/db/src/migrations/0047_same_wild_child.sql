-- Clear existing entries to prevent unique constraint violations
DELETE FROM "link_shares";--> statement-breakpoint
ALTER TABLE "link_shares" DROP CONSTRAINT "link_shares_user_domain_post_unique";--> statement-breakpoint
ALTER TABLE "link_shares" ADD CONSTRAINT "link_shares_post_url_unique" UNIQUE("post_url");