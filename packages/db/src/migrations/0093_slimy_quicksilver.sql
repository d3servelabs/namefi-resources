ALTER TABLE "user_login_history" ADD COLUMN "system_recognized_session_details" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_login_history" ADD COLUMN "user_recognized_session_details" boolean;--> statement-breakpoint
-- Backfill `system_recognized_session_details` for existing rows: the
-- system "recognizes" a session iff its IP and location aren't new. New
-- rows compute this in the application layer (see `recordLoginEvent` in
-- apps/backend/src/lib/login-notification/login-history.ts), but the
-- existing rows that pre-date this migration would otherwise sit at the
-- column default (false) and stay flagged forever in the UI.
UPDATE "user_login_history"
SET "system_recognized_session_details" = (NOT "is_new_ip" AND NOT "is_new_location");