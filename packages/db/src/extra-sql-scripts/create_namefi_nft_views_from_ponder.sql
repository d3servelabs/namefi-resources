-- Create database views for NFT data from ponder indexer
-- This provides a stable interface that insulates the application from schema changes
-- NamefiNftView - Complete NFT data with dates and metadata
-- Maps from ponder's NamefiNft table to a stable view interface
CREATE OR REPLACE VIEW namefi_nft_view AS
SELECT
  token_id,
  normalized_domain_name,
  expiration_time_in_seconds,
  CASE WHEN expiration_time_in_seconds IS NULL
    OR expiration_time_in_seconds = 0 THEN
    NULL
  ELSE
    to_timestamp(expiration_time_in_seconds)
  END AS expiration_time,
  is_locked,
  owner_address,
  chain_id,
  last_updated_block,
  last_updated_timestamp
FROM
  indexer."NamefiNft";

-- NamefiNftOwnersView - Simplified view for ownership queries
-- Based on namefiNftView with only essential columns for ownership checks
CREATE OR REPLACE VIEW namefi_nft_owners_view AS
SELECT
  normalized_domain_name,
  chain_id,
  owner_address,
  last_updated_block AS as_of_block_number
FROM
  namefi_nft_view;

-- Comments for documentation
COMMENT ON VIEW namefi_nft_view IS 'Complete NFT data view based on ponder NamefiNft table. Provides stable interface for accessing NFT metadata including expiration dates.';

COMMENT ON VIEW namefi_nft_owners_view IS 'Simplified ownership view based on namefiNftView. Contains only essential columns for ownership verification and domain management queries.';

