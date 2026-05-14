CREATE TYPE "public"."notification_body_type" AS ENUM('markdown', 'plain');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"body" text NOT NULL,
	"body_type" "notification_body_type" DEFAULT 'plain' NOT NULL,
	"related_resources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seen_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_unseen_idx" ON "notifications" USING btree ("user_id") WHERE "notifications"."seen_at" IS NULL AND "notifications"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX "notifications_related_resources_gin_idx" ON "notifications" USING gin ("related_resources");