ALTER TABLE "leadgen_leads" ADD COLUMN "contact_discovery_attempted_at" timestamp;--> statement-breakpoint
UPDATE "leadgen_leads"
SET "status" = 'low_priority'
WHERE "status" = 'validate_first';--> statement-breakpoint
UPDATE "leadgen_leads" AS "lead"
SET "contact_discovery_attempted_at" = "lead"."updated_at"
WHERE "lead"."contact_readiness" <> 'not_searched'
  OR EXISTS (
    SELECT 1
    FROM "leadgen_contacts" AS "contact"
    WHERE "contact"."lead_id" = "lead"."id"
      OR (
        "contact"."lead_id" IS NULL
        AND "contact"."run_id" = "lead"."run_id"
        AND "contact"."business_domain" = "lead"."business_domain"
      )
  )
  OR EXISTS (
    SELECT 1
    FROM "leadgen_email_drafts" AS "draft"
    WHERE "draft"."lead_id" = "lead"."id"
      OR (
        "draft"."lead_id" IS NULL
        AND "draft"."run_id" = "lead"."run_id"
        AND "draft"."business_domain" = "lead"."business_domain"
      )
  );--> statement-breakpoint
UPDATE "leadgen_contacts"
SET "metadata" = coalesce("metadata", '{}'::jsonb) || '{"fromCache": true}'::jsonb
WHERE "from_cache" IS TRUE;--> statement-breakpoint
UPDATE "leadgen_email_drafts"
SET "metadata" = coalesce("metadata", '{}'::jsonb) || '{"fromCache": true}'::jsonb
WHERE "from_cache" IS TRUE;--> statement-breakpoint
UPDATE "leadgen_runs"
SET "metadata" = coalesce("metadata", '{}'::jsonb) || jsonb_build_object('source', "input"->>'source')
WHERE "input" ? 'source'
  AND NULLIF(TRIM("input"->>'source'), '') IS NOT NULL
  AND NULLIF(TRIM(coalesce("metadata"->>'source', '')), '') IS NULL;--> statement-breakpoint
UPDATE "leadgen_contacts"
SET "metadata" = coalesce("metadata", '{}'::jsonb) || jsonb_build_object('contactDiscoveryNotes', "notes")
WHERE NULLIF(TRIM("notes"), '') IS NOT NULL
  AND NOT (coalesce("metadata", '{}'::jsonb) ? 'contactDiscoveryNotes');--> statement-breakpoint
UPDATE "leadgen_contacts" AS "contact"
SET "lead_id" = "lead"."id"
FROM "leadgen_leads" AS "lead"
WHERE "contact"."lead_id" IS NULL
  AND "lead"."run_id" = "contact"."run_id"
  AND "lead"."business_domain" = "contact"."business_domain";--> statement-breakpoint
UPDATE "leadgen_email_drafts" AS "draft"
SET "lead_id" = "lead"."id"
FROM "leadgen_leads" AS "lead"
WHERE "draft"."lead_id" IS NULL
  AND "lead"."run_id" = "draft"."run_id"
  AND "lead"."business_domain" = "draft"."business_domain";--> statement-breakpoint
UPDATE "leadgen_contacts" AS "contact"
SET "lead_id" = "draft"."lead_id"
FROM "leadgen_email_drafts" AS "draft"
WHERE "contact"."lead_id" IS NULL
  AND "draft"."contact_id" = "contact"."id"
  AND "draft"."lead_id" IS NOT NULL
  AND "draft"."contact_email" = "contact"."email";--> statement-breakpoint
INSERT INTO "leadgen_contacts" (
  "run_id",
  "lead_id",
  "business_domain",
  "email",
  "metadata",
  "created_at",
  "updated_at"
)
SELECT DISTINCT ON ("draft"."run_id", "draft"."business_domain", "draft"."contact_email")
  "draft"."run_id",
  "draft"."lead_id",
  "draft"."business_domain",
  "draft"."contact_email",
  coalesce("draft"."metadata", '{}'::jsonb),
  "draft"."created_at",
  "draft"."updated_at"
FROM "leadgen_email_drafts" AS "draft"
WHERE "draft"."lead_id" IS NOT NULL
  AND NULLIF(TRIM("draft"."contact_email"), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "leadgen_contacts" AS "contact"
    WHERE "contact"."lead_id" = "draft"."lead_id"
      AND "contact"."email" = "draft"."contact_email"
  )
ORDER BY "draft"."run_id", "draft"."business_domain", "draft"."contact_email", "draft"."updated_at" DESC, "draft"."created_at" DESC, "draft"."id" DESC
ON CONFLICT ON CONSTRAINT "leadgen_contacts_run_domain_email_unique" DO UPDATE
SET
  "lead_id" = coalesce("leadgen_contacts"."lead_id", EXCLUDED."lead_id"),
  "metadata" = coalesce("leadgen_contacts"."metadata", '{}'::jsonb) || EXCLUDED."metadata",
  "updated_at" = GREATEST("leadgen_contacts"."updated_at", EXCLUDED."updated_at");--> statement-breakpoint
UPDATE "leadgen_email_drafts" AS "draft"
SET "contact_id" = "contact"."id"
FROM (
  SELECT DISTINCT ON ("lead_id", "email")
    "id",
    "lead_id",
    "email"
  FROM "leadgen_contacts"
  WHERE "lead_id" IS NOT NULL
  ORDER BY "lead_id", "email", "updated_at" DESC, "created_at" DESC, "id" DESC
) AS "contact"
WHERE "draft"."lead_id" = "contact"."lead_id"
  AND "draft"."contact_email" = "contact"."email";--> statement-breakpoint
WITH "ranked_contacts" AS (
  SELECT
    "id",
    first_value("id") OVER (
      PARTITION BY "lead_id", "email"
      ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
    ) AS "keep_id",
    row_number() OVER (
      PARTITION BY "lead_id", "email"
      ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
    ) AS "row_number"
  FROM "leadgen_contacts"
  WHERE "lead_id" IS NOT NULL
)
UPDATE "leadgen_email_drafts" AS "draft"
SET "contact_id" = "ranked_contacts"."keep_id"
FROM "ranked_contacts"
WHERE "draft"."contact_id" = "ranked_contacts"."id"
  AND "ranked_contacts"."row_number" > 1;--> statement-breakpoint
WITH "ranked_contacts" AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "lead_id", "email"
      ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
    ) AS "row_number"
  FROM "leadgen_contacts"
  WHERE "lead_id" IS NOT NULL
)
DELETE FROM "leadgen_contacts" AS "contact"
USING "ranked_contacts"
WHERE "contact"."id" = "ranked_contacts"."id"
  AND "ranked_contacts"."row_number" > 1;--> statement-breakpoint
UPDATE "leadgen_email_drafts" AS "draft"
SET "contact_id" = NULL
FROM "leadgen_contacts" AS "contact"
WHERE "draft"."contact_id" = "contact"."id"
  AND "contact"."lead_id" IS NULL;--> statement-breakpoint
DELETE FROM "leadgen_contacts"
WHERE "lead_id" IS NULL;--> statement-breakpoint
UPDATE "leadgen_email_drafts" AS "draft"
SET "contact_id" = "contact"."id"
FROM (
  SELECT DISTINCT ON ("lead_id", "email")
    "id",
    "lead_id",
    "email"
  FROM "leadgen_contacts"
  ORDER BY "lead_id", "email", "updated_at" DESC, "created_at" DESC, "id" DESC
) AS "contact"
WHERE "draft"."contact_id" IS NULL
  AND "draft"."lead_id" = "contact"."lead_id"
  AND "draft"."contact_email" = "contact"."email";--> statement-breakpoint
DELETE FROM "leadgen_email_drafts" AS "draft"
WHERE "draft"."contact_id" IS NULL
  OR NOT EXISTS (
    SELECT 1
    FROM "leadgen_contacts" AS "contact"
    WHERE "contact"."id" = "draft"."contact_id"
  );--> statement-breakpoint
WITH "ranked_drafts" AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "contact_id"
      ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
    ) AS "row_number"
  FROM "leadgen_email_drafts"
)
DELETE FROM "leadgen_email_drafts" AS "draft"
USING "ranked_drafts"
WHERE "draft"."id" = "ranked_drafts"."id"
  AND "ranked_drafts"."row_number" > 1;--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP CONSTRAINT "leadgen_contacts_run_domain_email_unique";--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP CONSTRAINT "leadgen_email_drafts_run_domain_email_unique";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP CONSTRAINT "leadgen_contacts_run_id_leadgen_runs_id_fk";
--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP CONSTRAINT "leadgen_contacts_lead_id_leadgen_leads_id_fk";
--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP CONSTRAINT "leadgen_email_drafts_run_id_leadgen_runs_id_fk";
--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP CONSTRAINT "leadgen_email_drafts_lead_id_leadgen_leads_id_fk";
--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP CONSTRAINT "leadgen_email_drafts_contact_id_leadgen_contacts_id_fk";
--> statement-breakpoint
ALTER TABLE "leadgen_lead_signals" DROP CONSTRAINT "leadgen_lead_signals_run_id_leadgen_runs_id_fk";
--> statement-breakpoint
ALTER TABLE "leadgen_leads" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "leadgen_leads" ALTER COLUMN "status" SET DEFAULT 'checking'::text;--> statement-breakpoint
DROP TYPE "public"."leadgen_opportunity_status";--> statement-breakpoint
CREATE TYPE "public"."leadgen_opportunity_status" AS ENUM('checking', 'contact_now', 'low_priority', 'suppressed');--> statement-breakpoint
ALTER TABLE "leadgen_leads" ALTER COLUMN "status" SET DEFAULT 'checking'::"public"."leadgen_opportunity_status";--> statement-breakpoint
ALTER TABLE "leadgen_leads" ALTER COLUMN "status" SET DATA TYPE "public"."leadgen_opportunity_status" USING "status"::"public"."leadgen_opportunity_status";--> statement-breakpoint
DROP INDEX "leadgen_contacts_run_domain_idx";--> statement-breakpoint
DROP INDEX "leadgen_email_drafts_run_domain_idx";--> statement-breakpoint
DROP INDEX "leadgen_lead_signals_run_lead_idx";--> statement-breakpoint
DROP INDEX "leadgen_leads_run_status_rank_idx";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" ALTER COLUMN "lead_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" ALTER COLUMN "contact_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leadgen_contacts" ADD CONSTRAINT "leadgen_contacts_lead_id_leadgen_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leadgen_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" ADD CONSTRAINT "leadgen_email_drafts_contact_id_leadgen_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."leadgen_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leadgen_contacts_lead_idx" ON "leadgen_contacts" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leadgen_lead_signals_lead_created_idx" ON "leadgen_lead_signals" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "leadgen_leads_run_status_score_created_idx" ON "leadgen_leads" USING btree ("run_id","status","score","created_at");--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP COLUMN "run_id";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP COLUMN "business_domain";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP COLUMN "error_message";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" DROP COLUMN "from_cache";--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP COLUMN "run_id";--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP COLUMN "lead_id";--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP COLUMN "business_domain";--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP COLUMN "contact_email";--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" DROP COLUMN "from_cache";--> statement-breakpoint
ALTER TABLE "leadgen_events" DROP COLUMN "transient";--> statement-breakpoint
ALTER TABLE "leadgen_lead_signals" DROP COLUMN "run_id";--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "company_name";--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "risk_level";--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "risk_note";--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "contact_readiness";--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "query";--> statement-breakpoint
ALTER TABLE "leadgen_leads" DROP COLUMN "rank";--> statement-breakpoint
ALTER TABLE "leadgen_runs" DROP COLUMN "summary";--> statement-breakpoint
ALTER TABLE "leadgen_runs" DROP COLUMN "lead_count";--> statement-breakpoint
ALTER TABLE "leadgen_runs" DROP COLUMN "contact_count";--> statement-breakpoint
ALTER TABLE "leadgen_runs" DROP COLUMN "draft_count";--> statement-breakpoint
ALTER TABLE "leadgen_runs" DROP COLUMN "input";--> statement-breakpoint
ALTER TABLE "leadgen_contacts" ADD CONSTRAINT "leadgen_contacts_lead_email_unique" UNIQUE("lead_id","email");--> statement-breakpoint
ALTER TABLE "leadgen_email_drafts" ADD CONSTRAINT "leadgen_email_drafts_contact_unique" UNIQUE("contact_id");--> statement-breakpoint
DROP TYPE "public"."leadgen_contact_readiness";--> statement-breakpoint
DROP TYPE "public"."leadgen_risk_level";
