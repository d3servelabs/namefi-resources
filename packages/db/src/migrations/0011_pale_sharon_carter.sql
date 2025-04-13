ALTER TABLE "dns_records" RENAME COLUMN "normalized_domain_name" TO "zone_name";--> statement-breakpoint
ALTER TABLE "dns_records" DROP CONSTRAINT "dns_records_domain_name_type_class_rdata_unique";--> statement-breakpoint
DROP INDEX "dns_records_domain_idx";--> statement-breakpoint
CREATE INDEX "dns_records_domain_idx" ON "dns_records" USING btree ("zone_name");--> statement-breakpoint
ALTER TABLE "dns_records" ADD CONSTRAINT "dns_records_domain_name_type_class_rdata_unique" UNIQUE("zone_name","name","type","class","rdata");