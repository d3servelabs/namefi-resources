-- =====================================================================
-- Domain export tracking refactor:
--   * Add is_active column + partial unique index (terminal-freeze model)
--   * Add 15 per-email-type notification columns covering pending, failed,
--     and completed user emails (replaces legacy user_notified /
--     notified_at / pending_notified_at)
--   * Drop NOTIFIED from domain_export_status enum; backfill existing
--     NOTIFIED rows to TRANSFER_COMPLETED with isActive=false and
--     completed_export_email_sent_at populated from the legacy notified_at
--   * Drop legacy unique constraint and legacy unnotified partial index
--
-- Ordering matters: backfills run BEFORE the enum rotation so the new enum
-- (without NOTIFIED) can accept all existing rows; data is copied from
-- legacy columns into new columns BEFORE the legacy columns are dropped.
-- =====================================================================

-- 1. Add new columns first so backfills can write to them.
ALTER TABLE "domain_export_tracking" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "pending_export_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "pending_export_email_last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "pending_export_email_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "pending_export_email_last_error" text;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "pending_export_email_recipient" text;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "failed_export_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "failed_export_email_last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "failed_export_email_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "failed_export_email_last_error" text;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "failed_export_email_recipient" text;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "completed_export_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "completed_export_email_last_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "completed_export_email_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "completed_export_email_last_error" text;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ADD COLUMN "completed_export_email_recipient" text;--> statement-breakpoint

-- 2. Backfill legacy notification timestamps into new per-email-type columns.
-- last_attempt_at mirrors sent_at so a successful 1-attempt row stays
-- internally consistent (no null last-attempt for a row that reports a
-- completed send).
UPDATE "domain_export_tracking"
SET
  "pending_export_email_sent_at" = "pending_notified_at",
  "pending_export_email_last_attempt_at" = "pending_notified_at",
  "pending_export_email_attempts" = 1
WHERE "pending_notified_at" IS NOT NULL;--> statement-breakpoint

UPDATE "domain_export_tracking"
SET
  "completed_export_email_sent_at" = "notified_at",
  "completed_export_email_last_attempt_at" = "notified_at",
  "completed_export_email_attempts" = 1
WHERE "notified_at" IS NOT NULL;--> statement-breakpoint

-- 3. Flip is_active=false for rows already in a terminal status
-- (including the legacy NOTIFIED rows we're about to backfill).
UPDATE "domain_export_tracking"
SET "is_active" = false
WHERE "status" IN ('TRANSFER_COMPLETED', 'TRANSFER_FAILED', 'RESOLVED', 'NOTIFIED');--> statement-breakpoint

-- 4. Backfill legacy NOTIFIED rows to TRANSFER_COMPLETED in both the
-- current status and previous_status. completed_export_email_sent_at was
-- populated in step 2 (since NOTIFIED rows had notified_at set).
--
-- Both columns must be moved off 'NOTIFIED' before the enum rotation in
-- step 8, otherwise the USING ...::"public"."domain_export_status" cast
-- fails when previous_status still references the removed label.
UPDATE "domain_export_tracking"
SET "status" = 'TRANSFER_COMPLETED'
WHERE "status" = 'NOTIFIED';--> statement-breakpoint

UPDATE "domain_export_tracking"
SET "previous_status" = 'TRANSFER_COMPLETED'
WHERE "previous_status" = 'NOTIFIED';--> statement-breakpoint

-- 5. Drop legacy unique constraint (replaced with partial unique index below).
ALTER TABLE "domain_export_tracking" DROP CONSTRAINT "domain_export_tracking_domain_chain_unique";--> statement-breakpoint

-- 6. Drop legacy partial index before dropping its column.
DROP INDEX "domain_export_tracking_unnotified_idx";--> statement-breakpoint

-- 7. Drop legacy notification columns (data was moved in step 2).
ALTER TABLE "domain_export_tracking" DROP COLUMN "pending_notified_at";--> statement-breakpoint
ALTER TABLE "domain_export_tracking" DROP COLUMN "user_notified";--> statement-breakpoint
ALTER TABLE "domain_export_tracking" DROP COLUMN "notified_at";--> statement-breakpoint

-- 8. Rotate the enum to drop the NOTIFIED value.
-- Postgres rejects ALTER TYPE ... DROP VALUE, so we cast to text, recreate
-- the type without NOTIFIED, then cast back. Step 4 already moved all
-- NOTIFIED rows to TRANSFER_COMPLETED so the cast succeeds.
ALTER TABLE "domain_export_tracking" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ALTER COLUMN "previous_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."domain_export_status";--> statement-breakpoint
CREATE TYPE "public"."domain_export_status" AS ENUM('NO_SIGNAL', 'UNDETERMINED', 'PENDING_TRANSFER', 'TRANSFER_PERIOD', 'TRANSFER_COMPLETED', 'TRANSFER_FAILED', 'NEEDS_ADMIN_REVIEW', 'RESOLVED');--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ALTER COLUMN "status" SET DATA TYPE "public"."domain_export_status" USING "status"::"public"."domain_export_status";--> statement-breakpoint
ALTER TABLE "domain_export_tracking" ALTER COLUMN "previous_status" SET DATA TYPE "public"."domain_export_status" USING "previous_status"::"public"."domain_export_status";--> statement-breakpoint

-- 9. New active-row hot-path index + partial unique index.
CREATE INDEX "domain_export_tracking_active_idx" ON "domain_export_tracking" USING btree ("normalized_domain_name","chain_id") WHERE "domain_export_tracking"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "domain_export_tracking_active_domain_chain_unique" ON "domain_export_tracking" USING btree ("normalized_domain_name","chain_id") WHERE "domain_export_tracking"."is_active" = true;--> statement-breakpoint

-- 10. Non-negative CHECK constraints on the new attempt counters.
ALTER TABLE "domain_export_tracking"
  ADD CONSTRAINT "domain_export_tracking_pending_email_attempts_nonnegative"
  CHECK ("pending_export_email_attempts" >= 0);--> statement-breakpoint
ALTER TABLE "domain_export_tracking"
  ADD CONSTRAINT "domain_export_tracking_failed_email_attempts_nonnegative"
  CHECK ("failed_export_email_attempts" >= 0);--> statement-breakpoint
ALTER TABLE "domain_export_tracking"
  ADD CONSTRAINT "domain_export_tracking_completed_email_attempts_nonnegative"
  CHECK ("completed_export_email_attempts" >= 0);
