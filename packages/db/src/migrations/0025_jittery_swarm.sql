-- Custom SQL migration file, put your code below! --

-- Backfill all cart items to have 'REGISTER' item type
UPDATE "cart_items" 
SET "type" = 'REGISTER' 
WHERE "type" IS NULL;

-- Backfill all order items to have 'REGISTER' item type  
UPDATE "order_items" 
SET "type" = 'REGISTER' 
WHERE "type" IS NULL;