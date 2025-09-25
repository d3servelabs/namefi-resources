ALTER TABLE "ai_generations" ADD COLUMN "featured" boolean;

UPDATE "ai_generations" SET "featured" = false WHERE "featured" IS NULL;

ALTER TABLE "ai_generations" ALTER COLUMN "featured" SET NOT NULL;
ALTER TABLE "ai_generations" ALTER COLUMN "featured" SET DEFAULT false;
