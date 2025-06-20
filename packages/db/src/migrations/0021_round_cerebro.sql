-- Custom SQL migration file, put your code below! --

-- Backfill durationInYears to 3 for existing records where it's NULL

-- Update cart_items table
UPDATE "cart_items" 
SET "duration_in_years" = 3 
WHERE "duration_in_years" IS NULL;

-- Update order_items table  
UPDATE "order_items" 
SET "duration_in_years" = 3 
WHERE "duration_in_years" IS NULL;