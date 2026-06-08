CREATE TYPE "public"."sales_digest_target_delivery_status" AS ENUM('pending', 'sent', 'failed', 'skipped', 'partial');--> statement-breakpoint
CREATE TYPE "public"."sales_digest_target_type" AS ENUM('slack', 'telegram_group', 'discord_channel');--> statement-breakpoint
CREATE TABLE "sales_digest_animations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"generated_at" timestamp NOT NULL,
	"domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"digest_text_hash" text NOT NULL,
	"source_image_data_url_hash" text NOT NULL,
	"external_user_id" text NOT NULL,
	"title" text NOT NULL,
	"model" text NOT NULL,
	"sheet_model" text NOT NULL,
	"astra_generation_id" text NOT NULL,
	"url" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text DEFAULT 'video/mp4' NOT NULL,
	"source_image_url" text NOT NULL,
	"source_image_storage_path" text NOT NULL,
	"source_image_mime_type" text NOT NULL,
	"sheet_url" text NOT NULL,
	"sheet_storage_path" text NOT NULL,
	"sheet_prompt" text NOT NULL,
	"video_prompt" text NOT NULL,
	"animation_created_at" timestamp NOT NULL,
	"token_usage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"provider_metadata" jsonb,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_digest_animations_window_text_image_unique" UNIQUE("window_start","digest_text_hash","external_user_id","model","sheet_model","source_image_data_url_hash")
);
--> statement-breakpoint
CREATE TABLE "sales_digest_target_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid,
	"target_key" text NOT NULL,
	"status" "sales_digest_target_delivery_status" DEFAULT 'pending' NOT NULL,
	"created_by_user_id" uuid,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"digest_text_hash" text NOT NULL,
	"external_message_id" text,
	"external_message_url" text,
	"error" text,
	"response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_digest_deliveries_target_window_digest_unique" UNIQUE("target_key","window_start","digest_text_hash")
);
--> statement-breakpoint
CREATE TABLE "sales_digest_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" "sales_digest_target_type" NOT NULL,
	"label" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_digest_target_deliveries" ADD CONSTRAINT "sales_digest_target_deliveries_target_id_sales_digest_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."sales_digest_targets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_digest_target_deliveries" ADD CONSTRAINT "sales_digest_target_deliveries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_digest_targets" ADD CONSTRAINT "sales_digest_targets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sales_digest_animations_generated_idx" ON "sales_digest_animations" USING btree ("generated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sales_digest_deliveries_target_created_idx" ON "sales_digest_target_deliveries" USING btree ("target_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sales_digest_deliveries_status_created_idx" ON "sales_digest_target_deliveries" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sales_digest_targets_type_enabled_idx" ON "sales_digest_targets" USING btree ("target_type","enabled");--> statement-breakpoint
CREATE INDEX "sales_digest_targets_created_by_idx" ON "sales_digest_targets" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_digest_targets_slack_channel_unique" ON "sales_digest_targets" USING btree (("config"->>'channelId')) WHERE "sales_digest_targets"."target_type" = 'slack';--> statement-breakpoint
CREATE UNIQUE INDEX "sales_digest_targets_discord_channel_unique" ON "sales_digest_targets" USING btree (("config"->>'channelId')) WHERE "sales_digest_targets"."target_type" = 'discord_channel';--> statement-breakpoint
CREATE UNIQUE INDEX "sales_digest_targets_telegram_chat_thread_unique" ON "sales_digest_targets" USING btree (("config"->>'chatId'),COALESCE("config"->>'messageThreadId', '')) WHERE "sales_digest_targets"."target_type" = 'telegram_group';
