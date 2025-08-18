-- Migration: Update cta-2025-07-16 campaign domains
-- This migration removes all existing domains from the cta-2025-07-16 campaign
-- and replaces them with: starts.today, available.today, promos.today, discounts.today, ends.today

-- First, delete all existing domains for the cta-2025-07-16 campaign
DELETE FROM hunt_campaign_domains 
WHERE campaign_key = 'cta-2025-07-16';

-- Then, insert the new domains for the cta-2025-07-16 campaign
INSERT INTO hunt_campaign_domains (campaign_key, domain_name, created_at, updated_at)
VALUES 
  ('cta-2025-07-16', 'starts.today', NOW(), NOW()),
  ('cta-2025-07-16', 'available.today', NOW(), NOW()),
  ('cta-2025-07-16', 'promos.today', NOW(), NOW()),
  ('cta-2025-07-16', 'discounts.today', NOW(), NOW()),
  ('cta-2025-07-16', 'ends.today', NOW(), NOW());