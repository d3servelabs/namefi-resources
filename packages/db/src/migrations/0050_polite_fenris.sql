CREATE SCHEMA "namefi_ai";
--> statement-breakpoint
CREATE TABLE "namefi_ai"."domain_ai_analysis" (
	"token_id" numeric(78, 0) PRIMARY KEY NOT NULL,
	"explain" text,
	"appraisal" jsonb,
	"namefi_gpt_version" text,
	"normalized_domain_name" text NOT NULL,
	"dirty" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domain_ai_analysis_normalized_domain_name_unique" UNIQUE("normalized_domain_name")
);
--> statement-breakpoint
CREATE INDEX "domain_ai_analysis_dirty_idx" ON "namefi_ai"."domain_ai_analysis" USING btree ("dirty") WHERE "namefi_ai"."domain_ai_analysis"."dirty" = TRUE;--> statement-breakpoint
CREATE INDEX "domain_ai_analysis_updated_at_idx" ON "namefi_ai"."domain_ai_analysis" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "domain_ai_analysis_explain_null_idx" ON "namefi_ai"."domain_ai_analysis" USING btree ("token_id") WHERE "namefi_ai"."domain_ai_analysis"."explain" IS NULL;--> statement-breakpoint
CREATE INDEX "domain_ai_analysis_appraisal_null_idx" ON "namefi_ai"."domain_ai_analysis" USING btree ("token_id") WHERE "namefi_ai"."domain_ai_analysis"."appraisal" IS NULL;--> statement-breakpoint
CREATE VIEW "public"."namefi_nft_with_ai_analysis_view" AS (select "namefi_nft_view"."token_id", "namefi_nft_view"."normalized_domain_name", "namefi_nft_view"."expiration_time_in_seconds", "namefi_nft_view"."expiration_time", "namefi_nft_view"."is_locked", "namefi_nft_view"."owner_address", "namefi_nft_view"."chain_id", "namefi_nft_view"."last_updated_block", "namefi_nft_view"."last_updated_timestamp", "namefi_ai"."domain_ai_analysis"."explain", "namefi_ai"."domain_ai_analysis"."appraisal", "namefi_ai"."domain_ai_analysis"."namefi_gpt_version", "namefi_ai"."domain_ai_analysis"."dirty", "namefi_ai"."domain_ai_analysis"."created_at" as "ai_analysis_created_at", "namefi_ai"."domain_ai_analysis"."updated_at" as "ai_analysis_updated_at" from "namefi_nft_view" left join "namefi_ai"."domain_ai_analysis" on "namefi_nft_view"."token_id" = "namefi_ai"."domain_ai_analysis"."token_id");