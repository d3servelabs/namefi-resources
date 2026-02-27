import { pgSchema } from 'drizzle-orm/pg-core/schema';
import { secrets } from '../../lib/env';
import { managedIndexerDataSchema } from '../managed-indexer-data/tables';

/**
 * This is needed for preview deployments to allow reading from cloned data
 */
export const nftIndexSchema = secrets.MANAGED_NFT_INDEX
  ? managedIndexerDataSchema
  : pgSchema('indexed_onchain_data');
