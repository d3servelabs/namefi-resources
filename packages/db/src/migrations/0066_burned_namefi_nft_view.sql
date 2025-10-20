-- Migration: Create burned_namefi_nft_view
-- This view provides access to burned NFT logs from the ponder indexer
-- Following the same pattern as indexed_onchain_data_schemas.sql

-- First, ensure the indexed_onchain_data schema exists
CREATE SCHEMA IF NOT EXISTS indexed_onchain_data;

-- Create a dummy view if the indexed_onchain_data BurnedNamefiNftLog table doesn't exist yet
-- This allows migrations to run successfully even before ponder indexer is set up
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'BurnedNamefiNftLog' AND schemaname = 'indexed_onchain_data') THEN
        CREATE VIEW indexed_onchain_data."BurnedNamefiNftLog" AS
        SELECT
            1::numeric(78,0) AS token_id,
            'test.example' AS normalized_domain_name,
            '0x0000000000000000000000000000000000000000' AS from_address,
            1 AS chain_id,
            1::numeric(78,0) AS burned_block,
            1733683200::numeric(78,0) AS burned_timestamp,
            '0x0000000000000000000000000000000000000000000000000000000000000000' AS transaction_hash
        WHERE FALSE; -- Return no rows for dummy view
    ELSE
        RAISE NOTICE 'indexed_onchain_data."BurnedNamefiNftLog" already exists, skipping dummy view creation...';
    END IF;
END $$;

-- Create the actual public view that references the indexed_onchain_data schema
-- This provides a stable interface that insulates the application from schema changes
CREATE OR REPLACE VIEW burned_namefi_nft_view AS
SELECT
    token_id,
    normalized_domain_name,
    from_address,
    chain_id,
    burned_block,
    burned_timestamp,
    to_timestamp(burned_timestamp) AS burned_time,
    transaction_hash
FROM indexed_onchain_data."BurnedNamefiNftLog";

-- Comment for documentation
COMMENT ON VIEW burned_namefi_nft_view IS 'View of burned NFT logs from ponder indexer. Provides access to historical burn events including burn timestamp and transaction details.';
