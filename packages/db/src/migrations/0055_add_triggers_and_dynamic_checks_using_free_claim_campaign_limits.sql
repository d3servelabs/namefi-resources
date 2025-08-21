-- 0x.city Free Claim Campaign Setup
-- Creates the campaign limits table and seeds data for both campaigns

-- Create campaign limits table with source-specific limits support
-- Already created in 0054_icy_ozymandias.sql
-- CREATE TABLE IF NOT EXISTS free_claim_campaign_limits (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   campaign_key TEXT NOT NULL,
--   parent_domain TEXT NOT NULL,
--   source TEXT, -- NULL = applies to all sources, otherwise specific source (e.g., 'UPVOTE', 'SHARE')
--   max_claims_per_user INTEGER,
--   start_date TIMESTAMP NULL,
--   end_date TIMESTAMP NULL,
--   created_at TIMESTAMP NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP NOT NULL DEFAULT now(),
  
--   -- Unique constraint: one limit rule per (campaign, domain, source) combination
--   CONSTRAINT unique_campaign_domain_source UNIQUE (campaign_key, parent_domain, source)
-- );

-- Examples of advanced configurations:

-- Example 1: Source-specific limits within a campaign
-- INSERT INTO free_claim_campaign_limits (campaign_key, parent_domain, source, max_claims_per_user)
-- VALUES 
--   ('mixed-limits-campaign', '0x.city', 'UPVOTE', 2),    -- 2 claims max for upvotes
--   ('mixed-limits-campaign', '0x.city', 'SHARE', 1);     -- 1 claim max for shares

-- Example 2: Unlimited campaign (max_claims_per_user = NULL)
-- INSERT INTO free_claim_campaign_limits (campaign_key, parent_domain, source, max_claims_per_user)
-- VALUES ('unlimited-beta-2025', '0x.city', NULL, NULL);

-- Example 3: Different limits per source, with fallback
-- INSERT INTO free_claim_campaign_limits (campaign_key, parent_domain, source, max_claims_per_user)
-- VALUES 
--   ('flexible-campaign', '0x.city', NULL, 1),           -- Default: 1 claim for any source
--   ('flexible-campaign', '0x.city', 'UPVOTE', 3);       -- Override: 3 claims for upvotes specifically

-- Create constraint function to enforce per-campaign limits at database level
-- Supports source-specific limits with fallback to general campaign limits
CREATE OR REPLACE FUNCTION check_free_claim_limit() 
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    claim_source TEXT;
BEGIN
    -- Extract source from metadata
    claim_source := NEW.metadata->>'source';

    -- Try to get source-specific limit first (handle NULL source properly)
    IF claim_source IS NOT NULL THEN
        SELECT max_claims_per_user INTO max_allowed
        FROM free_claim_campaign_limits 
        WHERE campaign_key = NEW.group_or_campaign_key 
          AND parent_domain = NEW.parent_domain
          AND source = claim_source;
    END IF;
    
    -- If no source-specific limit found, try general campaign limit (source = NULL)
    IF max_allowed IS NULL THEN
        claim_source := NULL; -- reset claim_source to NULL to get general campaign current count
        SELECT max_claims_per_user INTO max_allowed
        FROM free_claim_campaign_limits 
        WHERE campaign_key = NEW.group_or_campaign_key 
          AND parent_domain = NEW.parent_domain
          AND source IS NULL;
    END IF;
    
    -- If still no limit found (null), allow unlimited claims
    IF max_allowed IS NULL THEN
        RETURN NEW; -- No limit, allow the insert
    END IF;
    
    -- Count current non-cancelled claims for this user+campaign+domain+source (handle NULL source)
    IF claim_source IS NOT NULL THEN
        SELECT COUNT(*) INTO current_count
        FROM free_claims 
        WHERE user_id = NEW.user_id 
          AND group_or_campaign_key = NEW.group_or_campaign_key
          AND parent_domain = NEW.parent_domain
          AND metadata->>'source' = claim_source;
    ELSE
        SELECT COUNT(*) INTO current_count
        FROM free_claims 
        WHERE user_id = NEW.user_id 
          AND group_or_campaign_key = NEW.group_or_campaign_key
          AND parent_domain = NEW.parent_domain
          AND metadata->>'source' IS NULL;
    END IF;
    
    -- Check if adding this claim would exceed the limit
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'User % has reached the limit of % claims for source % in campaign % on domain %', 
            NEW.user_id, max_allowed, COALESCE(claim_source, 'NULL'), NEW.group_or_campaign_key, NEW.parent_domain
            USING ERRCODE = 'check_violation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limits on insert
DROP TRIGGER IF EXISTS free_claim_limit_check ON free_claims;
CREATE TRIGGER free_claim_limit_check
    BEFORE INSERT ON free_claims
    FOR EACH ROW
    EXECUTE FUNCTION check_free_claim_limit();

-- Add comments for documentation
COMMENT ON TABLE free_claim_campaign_limits IS 'Campaign configuration for controlling free claim grants per campaign - provides DB-level limit enforcement';
COMMENT ON COLUMN free_claim_campaign_limits.campaign_key IS 'Unique identifier for the campaign';
COMMENT ON COLUMN free_claim_campaign_limits.parent_domain IS 'Parent domain for claims in this campaign';
COMMENT ON COLUMN free_claim_campaign_limits.max_claims_per_user IS 'Maximum number of claims per user for this campaign (NULL = unlimited) - enforced at DB level';
COMMENT ON COLUMN free_claim_campaign_limits.start_date IS 'Optional campaign start date';
COMMENT ON COLUMN free_claim_campaign_limits.end_date IS 'Optional campaign end date';
COMMENT ON FUNCTION check_free_claim_limit() IS 'Database trigger function to enforce per-campaign claim limits';