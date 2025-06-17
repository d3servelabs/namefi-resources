ALTER TABLE "domain_config" ADD COLUMN "auto_ens_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_config" ADD COLUMN "auto_park_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_config" ADD COLUMN "forward_to" text;--> statement-breakpoint
ALTER TABLE "domain_user_preferences" DROP COLUMN "auto_ens_enabled";--> statement-breakpoint
ALTER TABLE "domain_user_preferences" DROP COLUMN "auto_park_enabled";