import type { MarketplaceId } from './types';

export const ETHEREUM_MAINNET_CHAIN_ID = 1;
export const BASE_MAINNET_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * Chains where the Marketplace tab is allowed to render.
 *
 * Note: Sepolia (11155111) is intentionally excluded — OpenSea SDK v10.5's `Chain` enum
 * doesn't include it at runtime, so `createListing` and other SDK paths would fail.
 * Base Sepolia is the supported testnet.
 */
export const MARKETPLACE_SUPPORTED_CHAINS: readonly number[] = [
  ETHEREUM_MAINNET_CHAIN_ID,
  BASE_MAINNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
] as const;

const ADAPTER_CHAIN_SUPPORT: Record<MarketplaceId, readonly number[]> = {
  opensea: MARKETPLACE_SUPPORTED_CHAINS,
};

export function isMarketplaceSupportedOnChain(
  id: MarketplaceId,
  chainId: number,
): boolean {
  return ADAPTER_CHAIN_SUPPORT[id]?.includes(chainId) ?? false;
}

export function isChainSupportedByAnyMarketplace(chainId: number): boolean {
  return MARKETPLACE_SUPPORTED_CHAINS.includes(chainId);
}

export function getMarketplacesSupportedOnChain(
  chainId: number,
): readonly MarketplaceId[] {
  return (Object.keys(ADAPTER_CHAIN_SUPPORT) as MarketplaceId[]).filter((id) =>
    isMarketplaceSupportedOnChain(id, chainId),
  );
}
