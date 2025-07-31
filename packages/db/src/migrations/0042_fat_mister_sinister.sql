-- Migration: Update cv-2025-07-16 campaign domains
-- This migration removes all existing domains from the cv-2025-07-16 campaign
-- and replaces them with: taylor.cv, muller.cv, ali.cv, kumar.cv, li.cv

-- First, delete all existing domains for the cv-2025-07-16 campaign
DELETE FROM hunt_campaign_domains 
WHERE campaign_key = 'cv-2025-07-16';

-- Then, insert the new domains for the cv-2025-07-16 campaign
INSERT INTO hunt_campaign_domains (campaign_key, domain_name, created_at, updated_at)
VALUES 
  ('cv-2025-07-16', 'taylor.cv', NOW(), NOW()),
  ('cv-2025-07-16', 'muller.cv', NOW(), NOW()),
  ('cv-2025-07-16', 'ali.cv', NOW(), NOW()),
  ('cv-2025-07-16', 'kumar.cv', NOW(), NOW()),
  ('cv-2025-07-16', 'li.cv', NOW(), NOW());