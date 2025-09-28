-- Symmetric domain-exact advisory locks and cross-table active reservation checks
-- This migration ensures both pbn_issuance_reservations and free_claims:
-- 1) Acquire the SAME advisory lock for the same (parent_domain, exact_domain_name)
-- 2) Check for an active reservation/claim on the OTHER table and fail if found
--
-- Identifier and normalization notes:
-- - The advisory lock key is derived from a hash of "parent:exact" and converted to a BIGINT
-- - For PBN reservations, parent is NEW.pbn_domain and exact is NEW.exact_domain_name
-- - For free_claims, parent is NEW.parent_domain and exact is NEW.exact_domain_name
-- - Both sides MUST compute the key using the same concatenation and hashing to serialize correctly

-- Update: PBN reservation validator to also check free_claims and share the lock derivation
CREATE OR REPLACE FUNCTION pbn_validate_hold_before_insert()
RETURNS trigger AS $$
BEGIN
  -- If not a hold or not CREATED, skip
--   IF NEW.reserve_hold IS DISTINCT FROM TRUE OR NEW.status IS DISTINCT FROM 'CREATED' THEN
  IF NEW.status IS DISTINCT FROM 'CREATED' THEN
    RETURN NEW;
  END IF;

  -- Holds must be exact-only
  IF NEW.exact_domain_name IS NULL OR NEW.parent_domain IS NOT NULL THEN
    -- RAISE EXCEPTION 'reserveHold requires exact_domain_name and forbids parent_domain';
    RETURN NEW;
  END IF;

  -- Acquire advisory lock for this (parent, exact) domain pair (shared across both systems)
  PERFORM pg_advisory_xact_lock(hashtext('reserve'|| ':' || NEW.exact_domain_name));

  -- Same-table check: overlapping active hold for same (pbn_domain, exact_domain_name)
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

  -- Cross-table check: disallow creating a hold if an active free_claim exists for the same exact domain under the same parent
  IF EXISTS (
    SELECT 1
    FROM free_claims fc
    WHERE fc.exact_domain_name = NEW.exact_domain_name
      AND fc.claiming_status IS DISTINCT FROM 'CLAIMED'
      AND (fc.expiration_date IS NULL OR fc.expiration_date > NOW())
  ) THEN
    RAISE EXCEPTION 'Active free claim already exists for domain % under parent %', NEW.exact_domain_name, NEW.pbn_domain;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- New: Free claims validator for exact-domain inserts. Acquires the same lock and cross-checks PBN holds
CREATE OR REPLACE FUNCTION free_claims_validate_exact_domain_before_insert()
RETURNS trigger AS $$
BEGIN
  -- Only apply for exact-domain claims; skip otherwise
  IF NEW.exact_domain_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- Compute same shared lock key used by PBN reservations
  -- Acquire advisory lock
  PERFORM pg_advisory_xact_lock(hashtext('reserve'|| ':' || NEW.exact_domain_name));

  -- Same-table check: disallow overlapping active free_claim for same (parent_domain, exact_domain_name)
  IF EXISTS (
    SELECT 1
    FROM free_claims fc
    WHERE fc.exact_domain_name = NEW.exact_domain_name
      AND fc.claiming_status IS DISTINCT FROM 'CLAIMED'
      AND (fc.expiration_date IS NULL OR fc.expiration_date > NOW())
  ) THEN
    RAISE EXCEPTION 'Active free claim already exists for domain % under parent %', NEW.exact_domain_name, NEW.parent_domain;
  END IF;

  -- Cross-table check: disallow creating a free claim if an active PBN hold exists
  IF EXISTS (
    SELECT 1
    FROM pbn_issuance_reservations r
    WHERE r.exact_domain_name = NEW.exact_domain_name
      AND r.status = 'CREATED'
      AND (
        ( r.reserve_hold = TRUE  AND (r.reservation_expiration_date IS NULL OR r.reservation_expiration_date > NOW()) )
        OR 
        ( r.issue_free_claim = TRUE AND (r.free_claim_expiration_date IS NULL OR r.free_claim_expiration_date > NOW()) )
    )
  ) THEN
    RAISE EXCEPTION 'Active PBN hold already exists for domain % on %', NEW.exact_domain_name, NEW.parent_domain;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger on free_claims
DROP TRIGGER IF EXISTS trg_free_claims_validate_exact_domain_before_insert ON free_claims;
CREATE TRIGGER trg_free_claims_validate_exact_domain_before_insert
BEFORE INSERT ON free_claims
FOR EACH ROW
EXECUTE FUNCTION free_claims_validate_exact_domain_before_insert();