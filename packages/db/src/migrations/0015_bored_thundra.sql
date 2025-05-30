CREATE TABLE "domain_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"dnssec_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domain_config_domain_unique" UNIQUE("normalized_domain_name")
);
--> statement-breakpoint
CREATE TABLE "domain_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"auto_renew_enabled" boolean DEFAULT false NOT NULL,
	"auto_ens_enabled" boolean DEFAULT false NOT NULL,
	"auto_park_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domain_user_preferences_domain_user_id_unique" UNIQUE("normalized_domain_name","user_id")
);
--> statement-breakpoint
ALTER TABLE "domain_user_preferences" ADD CONSTRAINT "domain_user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domain_config_domain_idx" ON "domain_config" USING btree ("normalized_domain_name");--> statement-breakpoint
CREATE INDEX "domain_user_preferences_domain_idx" ON "domain_user_preferences" USING btree ("normalized_domain_name");--> statement-breakpoint
CREATE INDEX "domain_user_preferences_user_id_idx" ON "domain_user_preferences" USING btree ("user_id");