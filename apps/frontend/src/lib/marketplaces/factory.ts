import type { PublicClient, WalletClient } from 'viem';
import { isMarketplaceSupportedOnChain } from './chains';
import {
  type MarketPlace,
  MarketplaceUnsupportedChainError,
} from './marketplace.interface';
import type { MarketplaceId } from './types';

export interface GetMarketplaceArgs {
  id: MarketplaceId;
  chainId: number;
  publicClient: PublicClient;
  /** Required for write operations (create / cancel / accept). Read-only flows may omit. */
  walletClient?: WalletClient;
}

/**
 * Build a marketplace adapter for the given (id, chain) pair.
 *
 * The adapter modules are loaded via dynamic `import()` so their dependencies stay out
 * of the Next.js app-shell bundle — they only enter the client bundle when the
 * Marketplace tab is opened.
 *
 * @throws MarketplaceUnsupportedChainError when the (id, chainId) combination is not allowed.
 */
export async function getMarketplace(
  args: GetMarketplaceArgs,
): Promise<MarketPlace> {
  if (!isMarketplaceSupportedOnChain(args.id, args.chainId)) {
    throw new MarketplaceUnsupportedChainError(args.id, args.chainId);
  }

  const { OpenSeaAdapter } = await import('./opensea-adapter');
  return new OpenSeaAdapter(args);
}

export const MARKETPLACE_OPTIONS: ReadonlyArray<{
  id: MarketplaceId;
  label: string;
  description: string;
}> = [
  {
    id: 'opensea',
    label: 'OpenSea',
    description: 'Post directly to the OpenSea Seaport orderbook.',
  },
];
