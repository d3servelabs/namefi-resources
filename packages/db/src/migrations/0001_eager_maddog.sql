CREATE TABLE "dns_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"name" text DEFAULT '@' NOT NULL,
	"type" text NOT NULL,
	"class" text DEFAULT 'IN' NOT NULL,
	"ttl" integer DEFAULT 120 NOT NULL,
	"rdata" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dns_records_domain_name_type_class_rdata_unique" UNIQUE("normalized_domain_name","name","type","class","rdata")
);
--> statement-breakpoint
CREATE INDEX "dns_records_domain_idx" ON "dns_records" USING btree ("normalized_domain_name");--> statement-breakpoint
CREATE INDEX "dns_records_name_idx" ON "dns_records" USING btree ("name");--> statement-breakpoint
CREATE INDEX "dns_records_type_idx" ON "dns_records" USING btree ("type");