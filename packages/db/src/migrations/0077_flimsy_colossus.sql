CREATE TABLE "auditLog" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"actionType" text NOT NULL,
	"subjectId" text,
	"ipAddress" text,
	"userAgent" text,
	"changes" json,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"eventTimezone" text DEFAULT 'UTC' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subjectId" text NOT NULL,
	"domainId" text NOT NULL,
	"policyId" text,
	"purposeIds" json NOT NULL,
	"metadata" json,
	"ipAddress" text,
	"userAgent" text,
	"status" text DEFAULT 'active' NOT NULL,
	"withdrawalReason" text,
	"givenAt" timestamp DEFAULT now() NOT NULL,
	"validUntil" timestamp,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentPolicy" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"effectiveDate" timestamp NOT NULL,
	"expirationDate" timestamp,
	"content" text NOT NULL,
	"contentHash" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentPurpose" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"isEssential" boolean NOT NULL,
	"dataCategory" text,
	"legalBasis" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consentRecord" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"subjectId" text NOT NULL,
	"consentId" text,
	"actionType" text NOT NULL,
	"details" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"allowedOrigins" json,
	"isVerified" boolean DEFAULT true NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "domain_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "private_c15t_settings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"version" varchar(255) DEFAULT '1.0.0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"isIdentified" boolean DEFAULT false NOT NULL,
	"externalId" text,
	"identityProvider" text,
	"lastIpAddress" text,
	"subjectTimezone" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auditLog" ADD CONSTRAINT "auditLog_subject_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_subject_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_domain_domain_fk" FOREIGN KEY ("domainId") REFERENCES "public"."domain"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_consentPolicy_policy_fk" FOREIGN KEY ("policyId") REFERENCES "public"."consentPolicy"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "consentRecord" ADD CONSTRAINT "consentRecord_subject_subject_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."subject"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "consentRecord" ADD CONSTRAINT "consentRecord_consent_consent_fk" FOREIGN KEY ("consentId") REFERENCES "public"."consent"("id") ON DELETE restrict ON UPDATE restrict;