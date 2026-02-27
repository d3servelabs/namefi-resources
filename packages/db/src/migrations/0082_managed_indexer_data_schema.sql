-- Create managed_indexer_data schema for storing synced Ponder data
-- This schema contains actual tables that receive data synced from a remote Ponder indexer
-- The indexed_onchain_data views will point to these tables

CREATE SCHEMA IF NOT EXISTS "managed_indexer_data";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managed_indexer_data"."BurnedNamefiNftLog" (
	"token_id" numeric(78, 0) NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"from_address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"burned_block" numeric(78, 0) NOT NULL,
	"burned_timestamp" numeric(78, 0) NOT NULL,
	"transaction_hash" text NOT NULL,
	"expiration_time_at_burn" numeric(78, 0) NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "BurnedNamefiNftLog_token_id_chain_id_burned_block_pk" PRIMARY KEY("token_id","chain_id","burned_block")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managed_indexer_data"."ExpirationChangeLog" (
	"token_id" numeric(78, 0) NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"previous_expiration" numeric(78, 0) NOT NULL,
	"new_expiration" numeric(78, 0) NOT NULL,
	"changed_by" text NOT NULL,
	"chain_id" integer NOT NULL,
	"block_number" numeric(78, 0) NOT NULL,
	"block_timestamp" numeric(78, 0) NOT NULL,
	"transaction_hash" text NOT NULL,
	"source" text DEFAULT 'event' NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ExpirationChangeLog_token_id_chain_id_block_number_transaction_hash_pk" PRIMARY KEY("token_id","chain_id","block_number","transaction_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managed_indexer_data"."NamefiNft" (
	"token_id" numeric(78, 0) NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"expiration_time_in_seconds" numeric(78, 0) NOT NULL,
	"is_locked" boolean DEFAULT false,
	"owner_address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"last_updated_block" numeric(78, 0) NOT NULL,
	"last_updated_timestamp" numeric(78, 0) NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "NamefiNft_token_id_chain_id_pk" PRIMARY KEY("token_id","chain_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managed_indexer_data"."TransferLog" (
	"token_id" numeric(78, 0) NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"block_number" numeric(78, 0) NOT NULL,
	"block_timestamp" numeric(78, 0) NOT NULL,
	"transaction_hash" text NOT NULL,
	"is_burn" boolean DEFAULT false,
	"synced_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "TransferLog_token_id_chain_id_block_number_transaction_hash_pk" PRIMARY KEY("token_id","chain_id","block_number","transaction_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "managed_indexer_data"."sync_checkpoints" (
	"table_name" text PRIMARY KEY NOT NULL,
	"last_synced_block" numeric(78, 0) NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now(),
	"records_synced" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX "managed_burned_nft_chain_id_idx" ON "managed_indexer_data"."BurnedNamefiNftLog" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "managed_burned_nft_from_address_idx" ON "managed_indexer_data"."BurnedNamefiNftLog" USING btree ("from_address");--> statement-breakpoint
CREATE INDEX "managed_burned_nft_burned_block_idx" ON "managed_indexer_data"."BurnedNamefiNftLog" USING btree ("burned_block");--> statement-breakpoint
CREATE INDEX "managed_expiration_log_chain_id_idx" ON "managed_indexer_data"."ExpirationChangeLog" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "managed_expiration_log_changed_by_idx" ON "managed_indexer_data"."ExpirationChangeLog" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "managed_expiration_log_block_number_idx" ON "managed_indexer_data"."ExpirationChangeLog" USING btree ("block_number");--> statement-breakpoint
CREATE INDEX "managed_namefi_nft_is_locked_idx" ON "managed_indexer_data"."NamefiNft" USING btree ("is_locked");--> statement-breakpoint
CREATE INDEX "managed_namefi_nft_owner_address_idx" ON "managed_indexer_data"."NamefiNft" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "managed_namefi_nft_chain_id_idx" ON "managed_indexer_data"."NamefiNft" USING btree ("chain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "managed_namefi_nft_chain_domain_unique_idx" ON "managed_indexer_data"."NamefiNft" USING btree ("chain_id","normalized_domain_name");--> statement-breakpoint
CREATE INDEX "managed_namefi_nft_last_updated_block_idx" ON "managed_indexer_data"."NamefiNft" USING btree ("last_updated_block");--> statement-breakpoint
CREATE INDEX "managed_transfer_log_chain_id_idx" ON "managed_indexer_data"."TransferLog" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "managed_transfer_log_from_address_idx" ON "managed_indexer_data"."TransferLog" USING btree ("from_address");--> statement-breakpoint
CREATE INDEX "managed_transfer_log_to_address_idx" ON "managed_indexer_data"."TransferLog" USING btree ("to_address");--> statement-breakpoint
CREATE INDEX "managed_transfer_log_block_number_idx" ON "managed_indexer_data"."TransferLog" USING btree ("block_number");--> statement-breakpoint
CREATE INDEX "managed_transfer_log_is_burn_idx" ON "managed_indexer_data"."TransferLog" USING btree ("is_burn");

-- Comments for documentation
COMMENT ON SCHEMA managed_indexer_data IS 'Schema for storing on-chain data synced from a remote Ponder indexer';
COMMENT ON TABLE managed_indexer_data."NamefiNft" IS 'Current state of NameFI NFTs, synced from Ponder indexer';
COMMENT ON TABLE managed_indexer_data."BurnedNamefiNftLog" IS 'Log of burned NFTs, synced from Ponder indexer';
COMMENT ON TABLE managed_indexer_data."TransferLog" IS 'Log of NFT transfers, synced from Ponder indexer';
COMMENT ON TABLE managed_indexer_data."ExpirationChangeLog" IS 'Log of expiration changes, synced from Ponder indexer';
COMMENT ON TABLE managed_indexer_data.sync_checkpoints IS 'Tracks sync progress for incremental updates';
