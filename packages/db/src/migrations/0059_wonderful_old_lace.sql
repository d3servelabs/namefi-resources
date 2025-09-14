CREATE TABLE "internal_ai_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"type" "ai_generation_type" NOT NULL,
	"batch_id" text,
	"params" jsonb,
	"token_usage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_internal_generations_domain_idx" ON "internal_ai_generations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "ai_internal_generations_type_idx" ON "internal_ai_generations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ai_internal_generations_batch_id_idx" ON "internal_ai_generations" USING btree ("batch_id");