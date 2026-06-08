CREATE TABLE "managed_indexer_data"."in_flight_nft_tx" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"normalized_domain_name" text NOT NULL,
	"token_id" numeric(78, 0) NOT NULL,
	"change_type" text NOT NULL,
	"owner_address" text,
	"expiration_time_in_seconds" numeric(78, 0),
	"is_locked" boolean,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"tx_hash" text,
	"workflow_id" text NOT NULL,
	"run_id" text,
	"seq" bigserial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "in_flight_nft_tx_change_type_check" CHECK ("managed_indexer_data"."in_flight_nft_tx"."change_type" IN ('MINTING', 'CHANGING_EXPIRATION', 'CHANGING_LOCK')),
	CONSTRAINT "in_flight_nft_tx_status_check" CHECK ("managed_indexer_data"."in_flight_nft_tx"."status" IN ('PENDING', 'CONFIRMED', 'FAILED'))
);
--> statement-breakpoint
CREATE INDEX "in_flight_nft_tx_domain_status_idx" ON "managed_indexer_data"."in_flight_nft_tx" USING btree ("chain_id","normalized_domain_name","status");--> statement-breakpoint
CREATE INDEX "in_flight_nft_tx_status_idx" ON "managed_indexer_data"."in_flight_nft_tx" USING btree ("status");--> statement-breakpoint
CREATE INDEX "in_flight_nft_tx_expires_at_idx" ON "managed_indexer_data"."in_flight_nft_tx" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "in_flight_nft_tx_workflow_change_pending_unique_idx" ON "managed_indexer_data"."in_flight_nft_tx" USING btree ("workflow_id","change_type") WHERE "managed_indexer_data"."in_flight_nft_tx"."status" = 'PENDING';
