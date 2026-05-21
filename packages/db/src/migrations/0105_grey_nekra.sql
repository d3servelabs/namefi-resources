-- c15t v2 tenant columns are nullable for the existing single-tenant data.
-- Tenant-scoped composite FKs are intentionally deferred until after backfill.
CREATE TABLE "runtimePolicyDecision" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tenantId" text,
	"policyId" text NOT NULL,
	"fingerprint" text NOT NULL,
	"matchedBy" text NOT NULL,
	"countryCode" text,
	"regionCode" text,
	"jurisdiction" text NOT NULL,
	"language" text,
	"model" text NOT NULL,
	"policyI18n" json,
	"uiMode" text,
	"bannerUi" json,
	"dialogUi" json,
	"categories" json,
	"preselectedCategories" json,
	"proofConfig" json,
	"dedupeKey" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "runtimePolicyDecision_dedupeKey_unique" UNIQUE("dedupeKey")
);
--> statement-breakpoint
ALTER TABLE "runtimePolicyDecision" ADD CONSTRAINT "runtimePolicyDecision_consentPolicy_policy_fk" FOREIGN KEY ("policyId") REFERENCES "public"."consentPolicy"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "consentPolicy" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consentPolicy" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consentPolicy" ALTER COLUMN "contentHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consentPurpose" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consentPurpose" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consentPurpose" ALTER COLUMN "isEssential" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "auditLog" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "jurisdiction" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "jurisdictionModel" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "tcString" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "uiSource" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "consentAction" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "runtimePolicyDecisionId" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "runtimePolicySource" text;--> statement-breakpoint
ALTER TABLE "consent" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "consentPolicy" ADD COLUMN "hash" text;--> statement-breakpoint
ALTER TABLE "consentPolicy" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "consentPurpose" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "domain" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "subject" ADD COLUMN "tenantId" text;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_runtimePolicyDecision_runtimePolicyDecision_fk" FOREIGN KEY ("runtimePolicyDecisionId") REFERENCES "public"."runtimePolicyDecision"("id") ON DELETE restrict ON UPDATE restrict;
