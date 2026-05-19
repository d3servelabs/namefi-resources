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
 * Internal — args passed into the adapter constructor after the factory resolves
 * the auto-requested OpenSea API key.
 */
export interface OpenSeaAdapterArgs extends GetMarketplaceArgs {
  apiKey: string | undefined;
}

/**
 * Build a marketplace adapter for the given (id, chain) pair.
 *
 * The adapter modules are loaded via dynamic `import()` so their dependencies stay out
 * of the Next.js app-shell bundle — they only enter the client bundle when the
 * Marketplace tab is opened.
 *
 * On first call (per session) the factory awaits an auto-requested OpenSea API key
 * (free 30-day instant key, cached in localStorage). Subsequent calls hit the cache.
 *
 * @throws MarketplaceUnsupportedChainError when the (id, chainId) combination is not allowed.
 */
export async function getMarketplace(
  args: GetMarketplaceArgs,
): Promise<MarketPlace> {
  if (!isMarketplaceSupportedOnChain(args.id, args.chainId)) {
    throw new MarketplaceUnsupportedChainError(args.id, args.chainId);
  }

  const [{ OpenSeaAdapter }, { getOrRequestApiKey }, { getOpenSeaApiBaseUrl }] =
    await Promise.all([
      import('./opensea-adapter'),
      import('./opensea/api-key'),
      import('./opensea/constants'),
    ]);
  const apiKey = await getOrRequestApiKey(getOpenSeaApiBaseUrl(args.chainId));
  return new OpenSeaAdapter({ ...args, apiKey });
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
