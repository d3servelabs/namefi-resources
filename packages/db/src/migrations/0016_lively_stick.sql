CREATE TYPE "public"."ai_generation_type" AS ENUM('logo', 'marketing');--> statement-breakpoint
CREATE TABLE "ai_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"type" "ai_generation_type" NOT NULL,
	"reference_generation_id" uuid,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_reference_generation_fk" FOREIGN KEY ("reference_generation_id") REFERENCES "public"."ai_generations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_generations_user_domain_type_idx" ON "ai_generations" USING btree ("user_id","domain","type");--> statement-breakpoint
CREATE INDEX "ai_generations_user_domain_created_idx" ON "ai_generations" USING btree ("user_id","domain","created_at");