DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_campaign_send_status') THEN
        CREATE TYPE
        "public"."email_campaign_send_status"
        AS ENUM('PENDING', 'SENT', 'FAILED');
    END IF;
END$$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "email_campaign_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"campaign_key" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"status" "email_campaign_send_status" DEFAULT 'PENDING' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_campaign_sends_user_campaign_period_unique" UNIQUE("user_id","campaign_key","period_start"),
	CONSTRAINT "email_campaign_sends_attempt_count_nonnegative" CHECK (attempt_count >= 0)
);
--> statement-breakpoint
ALTER TABLE "email_campaign_sends" DROP CONSTRAINT IF EXISTS "email_campaign_sends_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "email_campaign_sends" ADD CONSTRAINT "email_campaign_sends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaign_sends_user_id_idx" ON "email_campaign_sends" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaign_sends_campaign_period_idx" ON "email_campaign_sends" USING btree ("campaign_key","period_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_campaign_sends_status_idx" ON "email_campaign_sends" USING btree ("status");
