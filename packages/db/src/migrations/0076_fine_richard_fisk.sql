CREATE TYPE "public"."api_key_type" AS ENUM('PLAIN', 'PUBLIC_PRIVATE');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "api_key_type" NOT NULL,
	"key_hash" text,
	"public_key" text,
	"key_prefix" text NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_type_fields_check" CHECK (("api_keys"."type" = 'PLAIN' AND "api_keys"."key_hash" IS NOT NULL AND "api_keys"."public_key" IS NULL)
          OR ("api_keys"."type" = 'PUBLIC_PRIVATE' AND "api_keys"."public_key" IS NOT NULL AND "api_keys"."key_hash" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_keys_user_active_idx" ON "api_keys" USING btree ("user_id","revoked_at") WHERE "api_keys"."revoked_at" IS NULL;