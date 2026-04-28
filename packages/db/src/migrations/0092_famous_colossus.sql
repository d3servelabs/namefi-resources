CREATE TABLE "user_login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text,
	"signed_in_at" timestamp NOT NULL,
	"last_accessed_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"os" text,
	"browser" text,
	"device" text,
	"login_method" text,
	"geo_city" text,
	"geo_subdivision" text,
	"geo_region_code" text,
	"geo_lat" numeric(9, 6),
	"geo_lng" numeric(9, 6),
	"is_google_lb" boolean DEFAULT false NOT NULL,
	"is_new_ip" boolean DEFAULT false NOT NULL,
	"is_new_location" boolean DEFAULT false NOT NULL,
	"is_first_session" boolean DEFAULT false NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_login_history_user_session_uniq" UNIQUE("user_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "user_login_history" ADD CONSTRAINT "user_login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_login_history_user_signed_in_idx" ON "user_login_history" USING btree ("user_id","signed_in_at");--> statement-breakpoint
CREATE INDEX "user_login_history_ip_idx" ON "user_login_history" USING btree ("ip_address");