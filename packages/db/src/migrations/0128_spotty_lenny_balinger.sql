CREATE TABLE "parked_domain_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"overall" text NOT NULL,
	"result" jsonb NOT NULL,
	"checked_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parked_domain_verifications_domain_unique" UNIQUE("normalized_domain_name")
);
--> statement-breakpoint
CREATE INDEX "parked_domain_verifications_checked_at_idx" ON "parked_domain_verifications" USING btree ("checked_at");