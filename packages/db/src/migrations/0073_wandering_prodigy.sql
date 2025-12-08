CREATE TABLE "public_ai_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_user_id" text NOT NULL,
	"domain" text NOT NULL,
	"type" "ai_generation_type" NOT NULL,
	"token_usage" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "public_ai_generations_external_user_idx" ON "public_ai_generations" USING btree ("external_user_id");--> statement-breakpoint
CREATE INDEX "public_ai_generations_domain_type_idx" ON "public_ai_generations" USING btree ("domain","type");