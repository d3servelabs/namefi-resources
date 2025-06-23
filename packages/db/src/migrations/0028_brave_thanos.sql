-- Custom SQL migration file, put your code below! --

-- Backfill registrar field in cart_items table to 'namefi' where it's currently null
UPDATE cart_items 
SET registrar = 'namefi' 
WHERE registrar IS NULL;

-- Backfill registrar field in order_items table to 'namefi' where it's currently null
UPDATE order_items 
SET registrar = 'namefi' 
WHERE registrar IS NULL;