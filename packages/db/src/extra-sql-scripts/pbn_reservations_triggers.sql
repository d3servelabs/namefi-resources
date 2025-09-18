-- Trigger functions and triggers for pbn_issuance_reservations

CREATE OR REPLACE FUNCTION pbn_validate_hold_before_insert()
RETURNS trigger AS $$
BEGIN
  -- If not a hold or not reserved, skip
  IF NEW.reserve_hold IS DISTINCT FROM TRUE OR NEW.status IS DISTINCT FROM 'CREATED' THEN
    RETURN NEW;
  END IF;

  -- Holds must be exact-only
  IF NEW.exact_domain_name IS NULL OR NEW.parent_domain IS NOT NULL THEN
    RAISE EXCEPTION 'reserveHold requires exact_domain_name and forbids parent_domain';
  END IF;

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

-- Optional: validate active free-claim duplicate per recipient+exact
CREATE OR REPLACE FUNCTION pbn_validate_free_claim_before_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.issue_free_claim IS DISTINCT FROM TRUE OR NEW.exact_domain_name IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.recipient_email IS NULL THEN
    RAISE EXCEPTION 'recipient_email required when issueFreeClaim = true';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pbn_issuance_reservations r
    WHERE r.recipient_email = NEW.recipient_email
      AND r.exact_domain_name = NEW.exact_domain_name
      AND r.status = 'CREATED'
      AND (r.free_claim_expiration_date IS NULL OR r.free_claim_expiration_date > NOW())
  ) THEN
    RAISE EXCEPTION 'Active free-claim reservation already exists for recipient % and domain %', NEW.recipient_email, NEW.exact_domain_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pbn_validate_free_claim_before_insert ON pbn_issuance_reservations;
CREATE TRIGGER trg_pbn_validate_free_claim_before_insert
BEFORE INSERT ON pbn_issuance_reservations
FOR EACH ROW
EXECUTE FUNCTION pbn_validate_free_claim_before_insert();


