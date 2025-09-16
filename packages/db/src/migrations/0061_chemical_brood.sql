-- Backfill marketing input.collateralType to 'billboard' where missing
-- Rationale: previously only billboard was supported; ensure historical rows are consistent

BEGIN;

-- User-facing generations
UPDATE "ai_generations"
SET "input" = jsonb_set("input", '{collateralType}', '"billboard"'::jsonb, true)
WHERE "type" = 'marketing'
  AND ("input"->>'type') = 'marketing'
  AND (NOT ("input" ? 'collateralType') OR ("input"->>'collateralType') IS NULL);

-- Internal operational generations
UPDATE "internal_ai_generations"
SET "input" = jsonb_set("input", '{collateralType}', '"billboard"'::jsonb, true)
WHERE "type" = 'marketing'
  AND ("input"->>'type') = 'marketing'
  AND (NOT ("input" ? 'collateralType') OR ("input"->>'collateralType') IS NULL);

COMMIT;