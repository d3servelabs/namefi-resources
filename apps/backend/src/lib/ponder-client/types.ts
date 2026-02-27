import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

/**
 * Response from Ponder SQL over HTTP endpoint
 */
export type PonderSqlResponse<T = Record<string, unknown>> = {
  rows: T[];
  meta: {
    columns: Array<{
      name: string;
      type: string;
    }>;
    rowCount: number;
  };
};

/**
 * NamefiNft record from Ponder
 */
export type PonderNamefiNft = {
  token_id: string;
  normalized_domain_name: NamefiNormalizedDomain;
  expiration_time_in_seconds: string;
  is_locked: boolean;
  owner_address: string;
  chain_id: number;
  last_updated_block: string;
  last_updated_timestamp: string;
};

/**
 * BurnedNamefiNftLog record from Ponder
 */
export type PonderBurnedNamefiNftLog = {
  token_id: string;
  normalized_domain_name: NamefiNormalizedDomain;
  from_address: string;
  chain_id: number;
  burned_block: string;
  burned_timestamp: string;
  transaction_hash: string;
  expiration_time_at_burn: string;
};

/**
 * TransferLog record from Ponder
 */
export type PonderTransferLog = {
  token_id: string;
  normalized_domain_name: NamefiNormalizedDomain;
  from_address: string;
  to_address: string;
  chain_id: number;
  block_number: string;
  block_timestamp: string;
  transaction_hash: string;
  is_burn: boolean;
};

/**
 * ExpirationChangeLog record from Ponder
 */
export type PonderExpirationChangeLog = {
  token_id: string;
  normalized_domain_name: NamefiNormalizedDomain;
  previous_expiration: string;
  new_expiration: string;
  changed_by: string;
  chain_id: number;
  block_number: string;
  block_timestamp: string;
  transaction_hash: string;
  source: string;
};

/**
 * Ponder table names
 */
export type PonderTableName =
  | 'NamefiNft'
  | 'BurnedNamefiNftLog'
  | 'TransferLog'
  | 'ExpirationChangeLog';

/**
 * Options for fetching data from Ponder
 */
export type PonderFetchOptions = {
  /**
   * Only fetch records with block number greater than this value
   */
  sinceBlock?: bigint;
  /**
   * Maximum number of records to fetch (for pagination)
   */
  limit?: number;
  /**
   * Offset for pagination
   */
  offset?: number;
};
