CREATE TABLE "link_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"post_url" text NOT NULL,
	"shared_url" text NOT NULL,
	"campaign_key" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verification_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "link_shares_user_domain_post_unique" UNIQUE("user_id","normalized_domain_name","post_url")
);
--> statement-breakpoint
ALTER TABLE "link_shares" ADD CONSTRAINT "link_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_shares" ADD CONSTRAINT "link_shares_campaign_key_hunt_campaigns_campaign_key_fk" FOREIGN KEY ("campaign_key") REFERENCES "public"."hunt_campaigns"("campaign_key") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_shares_user_domain_idx" ON "link_shares" USING btree ("user_id","normalized_domain_name");--> statement-breakpoint
CREATE INDEX "link_shares_domain_recent_idx" ON "link_shares" USING btree ("normalized_domain_name","created_at");--> statement-breakpoint
CREATE INDEX "link_shares_verification_idx" ON "link_shares" USING btree ("verified","created_at");--> statement-breakpoint
CREATE INDEX "link_shares_campaign_idx" ON "link_shares" USING btree ("campaign_key");