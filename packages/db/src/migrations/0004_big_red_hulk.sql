CREATE TABLE "namefi_nft" (
	"normalized_domain_name" text NOT NULL,
	"chain_id" integer NOT NULL,
	"as_of_block_number" integer NOT NULL,
	"owner_address" text NOT NULL,
	CONSTRAINT "namefi_nft_normalized_domain_name_pk" PRIMARY KEY("normalized_domain_name")
);
--> statement-breakpoint
CREATE INDEX "namefi_nft_owner_address_idx" ON "namefi_nft" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "namefi_nft_chain_id_idx" ON "namefi_nft" USING btree ("chain_id");