CREATE SCHEMA "namefi_announcements";
--> statement-breakpoint
CREATE TYPE "namefi_announcements"."announcement_variant" AS ENUM('info', 'warning', 'success', 'danger');--> statement-breakpoint
CREATE TABLE "namefi_announcements"."announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"variant" "namefi_announcements"."announcement_variant" DEFAULT 'info' NOT NULL,
	"link_url" text,
	"link_label" text,
	"dismissible" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"priority" integer DEFAULT 0 NOT NULL,
	"condition" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_dates_valid" CHECK (("namefi_announcements"."announcements"."starts_at" IS NULL OR "namefi_announcements"."announcements"."ends_at" IS NULL OR "namefi_announcements"."announcements"."ends_at" > "namefi_announcements"."announcements"."starts_at"))
);
--> statement-breakpoint
CREATE INDEX "announcements_active_priority_idx" ON "namefi_announcements"."announcements" USING btree ("is_active","priority" DESC NULLS LAST,"created_at" DESC NULLS LAST);