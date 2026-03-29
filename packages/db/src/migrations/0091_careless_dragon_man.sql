BEGIN;

-- Backfill surviving user-facing Veo animation rows into the new
-- cinematic-mode JSON shape. We only preserve rows that can map cleanly.
UPDATE "ai_generations"
SET "input" = jsonb_set(
  jsonb_set(
    COALESCE("input", '{}'::jsonb),
    '{mode}',
    '"cinematic"'::jsonb,
    true
  ),
  '{sourceMode}',
  COALESCE("input"->'sourceMode', '"exact-frame"'::jsonb),
  true
)
WHERE "type" = 'animation'
  AND ("input"->>'type') = 'animation'
  AND COALESCE("input"->>'model', '') IN (
    'veo-3.1-generate-preview',
    'veo-3.1-fast-generate-preview'
  );

-- Remove unsupported or malformed user-facing animation rows. The feature is
-- not live yet, so data cleanup is preferred over carrying compatibility code.
DELETE FROM "ai_generations"
WHERE "type" = 'animation'
  AND (
    COALESCE("input"->>'type', '') <> 'animation'
    OR COALESCE("input"->>'mode', '') <> 'cinematic'
    OR COALESCE("input"->>'model', '') NOT IN (
      'veo-3.1-generate-preview',
      'veo-3.1-fast-generate-preview'
    )
    OR COALESCE("input"->>'motionPreset', '') NOT IN (
      'let-ai-choose',
      'orbital-reveal',
      'energy-surge',
      'atmospheric-rise',
      'dimensional-parallax',
      'prismatic-bloom'
    )
    OR COALESCE("input"->>'sourceMode', 'exact-frame') NOT IN (
      'exact-frame',
      'subject-reference'
    )
    OR COALESCE("output"->>'type', '') <> 'animation'
    OR COALESCE("output"->>'model', '') NOT IN (
      'veo-3.1-generate-preview',
      'veo-3.1-fast-generate-preview'
    )
  );

-- Public and internal animation rows are not supported by any live path.
DELETE FROM "public_ai_generations"
WHERE "type" = 'animation';

DELETE FROM "internal_ai_generations"
WHERE "type" = 'animation';

COMMIT;
