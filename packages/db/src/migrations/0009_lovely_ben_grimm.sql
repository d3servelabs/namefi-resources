ALTER TABLE "orders" ADD COLUMN "nft_wallet_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "nft_chain_id" integer NOT NULL;