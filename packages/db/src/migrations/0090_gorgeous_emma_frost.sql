CREATE TYPE "public"."ai_generation_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
ALTER TYPE "public"."ai_generation_type" ADD VALUE 'animation';--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "status" "ai_generation_status" DEFAULT 'SUCCEEDED' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "error_message" text;--> statement-breakpoint
CREATE INDEX "ai_generations_status_idx" ON "ai_generations" USING btree ("status");