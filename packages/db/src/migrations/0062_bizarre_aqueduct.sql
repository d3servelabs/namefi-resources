CREATE TYPE "public"."pbn_issuance_reservation_status" AS ENUM('CREATED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "pbn_issuance_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pbn_domain" text NOT NULL,
	"recipient_email" text,
	"recipient_user_id" uuid,
	"exact_domain_name" text,
	"parent_domain" text,
	"reason" text,
	"issue_free_claim" boolean DEFAULT false NOT NULL,
	"reserve_hold" boolean DEFAULT true NOT NULL,
	"creator_id" uuid NOT NULL,
	"personal_message" text,
	"reservation_expiration_date" timestamp,
	"free_claim_expiration_date" timestamp,
	"status" "pbn_issuance_reservation_status" DEFAULT 'CREATED' NOT NULL,
	"claimed_at" timestamp,
	"free_claim_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pbn_reservations_behavior_at_least_one" CHECK ("pbn_issuance_reservations"."reserve_hold" OR "pbn_issuance_reservations"."issue_free_claim"),
	CONSTRAINT "pbn_reservations_hold_on_exact_only" CHECK ((NOT "pbn_issuance_reservations"."reserve_hold") OR ("pbn_issuance_reservations"."exact_domain_name" IS NOT NULL AND "pbn_issuance_reservations"."parent_domain" IS NULL)),
	CONSTRAINT "pbn_reservations_parent_only_with_free_claim" CHECK (("pbn_issuance_reservations"."parent_domain" IS NULL) OR "pbn_issuance_reservations"."issue_free_claim"),
	CONSTRAINT "pbn_reservations_exact_domain_xor_parent_domain" CHECK (("pbn_issuance_reservations"."exact_domain_name" IS NULL) <> ("pbn_issuance_reservations"."parent_domain" IS NULL)),
	CONSTRAINT "pbn_reservations_expiration_when_no_hold_null" CHECK ("pbn_issuance_reservations"."reserve_hold" OR "pbn_issuance_reservations"."reservation_expiration_date" IS NULL),
	CONSTRAINT "pbn_reservations_free_claim_expiration_only_when_issuing" CHECK ("pbn_issuance_reservations"."issue_free_claim" OR "pbn_issuance_reservations"."free_claim_expiration_date" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "pbn_issuance_reservations" ADD CONSTRAINT "pbn_issuance_reservations_pbn_domain_poweredby_namefi_domains_normalized_domain_name_fk" FOREIGN KEY ("pbn_domain") REFERENCES "public"."poweredby_namefi_domains"("normalized_domain_name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbn_issuance_reservations" ADD CONSTRAINT "pbn_issuance_reservations_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbn_issuance_reservations" ADD CONSTRAINT "pbn_issuance_reservations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pbn_issuance_reservations" ADD CONSTRAINT "pbn_issuance_reservations_free_claim_id_free_claims_id_fk" FOREIGN KEY ("free_claim_id") REFERENCES "public"."free_claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pbn_reservations_recipient_user_idx" ON "pbn_issuance_reservations" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "pbn_reservations_pbn_domain_idx" ON "pbn_issuance_reservations" USING btree ("pbn_domain");--> statement-breakpoint
CREATE INDEX "pbn_reservations_status_idx" ON "pbn_issuance_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pbn_reservations_reservation_expiration_idx" ON "pbn_issuance_reservations" USING btree ("reservation_expiration_date");--> statement-breakpoint
CREATE INDEX "pbn_reservations_parent_domain_idx" ON "pbn_issuance_reservations" USING btree ("parent_domain");--> statement-breakpoint
CREATE INDEX "pbn_reservations_creator_idx" ON "pbn_issuance_reservations" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "pbn_reservations_recipient_status_idx" ON "pbn_issuance_reservations" USING btree ("recipient_email","status");--> statement-breakpoint
CREATE INDEX "pbn_reservations_creator_status_idx" ON "pbn_issuance_reservations" USING btree ("creator_id","status");

-- Trigger functions and triggers for pbn_issuance_reservations

CREATE OR REPLACE FUNCTION pbn_validate_hold_before_insert()
RETURNS trigger AS $$
DECLARE
  -- Use domain name as hash to get consistent lock key
  lock_key bigint := ('x' || substr(md5(NEW.pbn_domain || ':' || NEW.exact_domain_name), 1, 16))::bit(64)::bigint;
BEGIN
  -- If not a hold or not CREATED, skip
  IF NEW.reserve_hold IS DISTINCT FROM TRUE OR NEW.status IS DISTINCT FROM 'CREATED' THEN
    RETURN NEW;
  END IF;

  -- Holds must be exact-only
  IF NEW.exact_domain_name IS NULL OR NEW.parent_domain IS NOT NULL THEN
    RAISE EXCEPTION 'reserveHold requires exact_domain_name and forbids parent_domain';
  END IF;

  -- Acquire advisory lock for this domain
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Check for any overlapping active hold for same (pbn_domain, exact_domain_name)
  IF EXISTS (
    SELECT 1
    FROM pbn_issuance_reservations r
    WHERE r.pbn_domain = NEW.pbn_domain
      AND r.exact_domain_name = NEW.exact_domain_name
      AND r.status = 'CREATED'
      AND r.reserve_hold = TRUE
      AND (r.reservation_expiration_date IS NULL OR r.reservation_expiration_date > NOW())
  ) THEN
    RAISE EXCEPTION 'Active hold already exists for domain % on %', NEW.exact_domain_name, NEW.pbn_domain;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pbn_validate_hold_before_insert ON pbn_issuance_reservations;
CREATE TRIGGER trg_pbn_validate_hold_before_insert
BEFORE INSERT ON pbn_issuance_reservations
FOR EACH ROW
EXECUTE FUNCTION pbn_validate_hold_before_insert();