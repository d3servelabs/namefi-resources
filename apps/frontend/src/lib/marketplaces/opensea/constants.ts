import { Chain } from '@opensea/sdk/viem';
import {
  BASE_MAINNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '../chains';

/**
 * Map chain ID → OpenSea SDK `Chain` enum value.
 *
 * The SDK's v10.5 runtime `Chain` enum doesn't include Sepolia, so it's intentionally
 * absent here. Base Sepolia is the supported testnet.
 */
export const CHAIN_ID_TO_OPENSEA_CHAIN: Record<number, Chain> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: Chain.Mainnet,
  [BASE_MAINNET_CHAIN_ID]: Chain.Base,
  // `Chain.BaseSepolia` isn't exposed in v10.5 types but exists at runtime as
  // `'base_sepolia'`. Cast to keep type-safety on the lookup.
  [BASE_SEPOLIA_CHAIN_ID]: 'base_sepolia' as Chain,
};

/**
 * Map chain ID → OpenSea v2 REST URL path segment (`/api/v2/orders/{slug}/seaport/*`).
 */
export const CHAIN_ID_TO_OPENSEA_SLUG: Record<number, string> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: 'ethereum',
  [BASE_MAINNET_CHAIN_ID]: 'base',
  [BASE_SEPOLIA_CHAIN_ID]: 'base_sepolia',
};

/** Chains that route through the testnet base URL. */
export const TESTNET_CHAIN_IDS = new Set<number>([BASE_SEPOLIA_CHAIN_ID]);

/**
 * OpenSea base URLs. The mainnet hostname serves Ethereum + Base + other prod chains;
 * the testnets hostname serves Base Sepolia (+ any future testnet support).
 */
export const OPENSEA_API_BASE_MAINNET = 'https://api.opensea.io';
export const OPENSEA_API_BASE_TESTNET = 'https://testnets-api.opensea.io';
export const OPENSEA_SITE_BASE_MAINNET = 'https://opensea.io';
export const OPENSEA_SITE_BASE_TESTNET = 'https://testnets.opensea.io';

export function getOpenSeaApiBaseUrl(chainId: number): string {
  return TESTNET_CHAIN_IDS.has(chainId)
    ? OPENSEA_API_BASE_TESTNET
    : OPENSEA_API_BASE_MAINNET;
}

/**
 * OpenSea protocol fee in basis points.
 *
 * Updated to 1.0% in September 2025 (https://docs.opensea.io/changelog/opensea-fee-update).
 * Used only for the off-chain fee preview — the authoritative fee is computed by Seaport
 * at order-signing time based on the response from OpenSea's order-builder.
 */
export const OPENSEA_PROTOCOL_FEE_BPS = 100;
