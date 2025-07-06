CREATE TABLE "indexed_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"registrar_key" text NOT NULL,
	"expiration_time" timestamp NOT NULL,
	"last_indexed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "indexed_domains_registrar_domain_unique" UNIQUE("registrar_key","normalized_domain_name")
);
--> statement-breakpoint
CREATE INDEX "indexed_domains_domain_name_idx" ON "indexed_domains" USING btree ("normalized_domain_name");--> statement-breakpoint
CREATE INDEX "indexed_domains_registrar_key_idx" ON "indexed_domains" USING btree ("registrar_key");--> statement-breakpoint
CREATE INDEX "indexed_domains_expiration_time_idx" ON "indexed_domains" USING btree ("expiration_time");--> statement-breakpoint
CREATE INDEX "indexed_domains_registrar_domain_idx" ON "indexed_domains" USING btree ("registrar_key","normalized_domain_name");--> statement-breakpoint
CREATE INDEX "indexed_domains_last_indexed_at_idx" ON "indexed_domains" USING btree ("last_indexed_at");