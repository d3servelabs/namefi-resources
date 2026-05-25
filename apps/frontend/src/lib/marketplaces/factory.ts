import type { PublicClient, WalletClient } from 'viem';
import { clientSideEnv } from '../env';
import { isMarketplaceSupportedOnChain } from './chains';
import {
  type MarketPlace,
  MarketplaceNotConfiguredError,
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
 * Internal — args passed into the Rarible adapter constructor. The factory
 * resolves the API key from env and throws `MarketplaceNotConfiguredError`
 * when it's absent, so (unlike OpenSea's auto-requested key) this is required.
 */
export interface RaribleAdapterArgs extends GetMarketplaceArgs {
  apiKey: string;
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

  if (args.id === 'rarible') {
    // Rarible has no instant-key endpoint — the key comes from env.
    const apiKey = clientSideEnv.NEXT_PUBLIC_RARIBLE_API_KEY;
    if (!apiKey) {
      throw new MarketplaceNotConfiguredError(
        'rarible',
        'NEXT_PUBLIC_RARIBLE_API_KEY',
      );
    }
    const { RaribleAdapter } = await import('./rarible-adapter');
    return new RaribleAdapter({ ...args, apiKey });
  }

  if (args.id === 'okx') {
    // OKX needs no client-side key — its HMAC secret lives in the backend
    // `nftMarketplaces` proxy that the adapter calls.
    const { OkxAdapter } = await import('./okx-adapter');
    return new OkxAdapter(args);
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
  {
    id: 'rarible',
    label: 'Rarible',
    description: 'Post directly to the Rarible orderbook.',
  },
  {
    id: 'okx',
    label: 'OKX',
    description: 'Post directly to the OKX NFT marketplace.',
  },
];

/**
 * Per-marketplace badge icon — a path under `apps/frontend/public/`, rendered
 * by the listings / offers cards. Extensions differ per asset (OpenSea and
 * Rarible ship as SVG, OKX as PNG).
 */
export const MARKETPLACE_ICONS: Record<MarketplaceId, string> = {
  opensea: '/opensea.svg',
  rarible: '/rarible.svg',
  okx: '/okx.png',
};
