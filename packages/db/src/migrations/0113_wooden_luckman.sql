CREATE TABLE "ai_credit_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"awarded_by_admin_user_id" uuid,
	"amount_credits" integer NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_awards_amount_positive" CHECK ("ai_credit_awards"."amount_credits" > 0)
);
--> statement-breakpoint
ALTER TABLE "ai_credit_awards" ADD CONSTRAINT "ai_credit_awards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_awards" ADD CONSTRAINT "ai_credit_awards_awarded_by_admin_user_id_users_id_fk" FOREIGN KEY ("awarded_by_admin_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_credit_awards_user_idx" ON "ai_credit_awards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_credit_awards_admin_idx" ON "ai_credit_awards" USING btree ("awarded_by_admin_user_id");--> statement-breakpoint
CREATE INDEX "ai_credit_awards_expires_at_idx" ON "ai_credit_awards" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "ai_credit_awards_created_at_idx" ON "ai_credit_awards" USING btree ("created_at");