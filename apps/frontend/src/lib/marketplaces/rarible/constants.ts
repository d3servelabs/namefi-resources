import {
  BASE_MAINNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from '../chains';

/**
 * Rarible SDK environment. Mainnet chains use `prod`; testnets use `testnet`.
 * (`development` also exists but we don't target it.)
 */
export type RaribleEnv = 'prod' | 'testnet';

/**
 * Rarible "Blockchain" union identifier per chain ID. Rarible does NOT have
 * separate testnet blockchain ids — Base Sepolia is still `BASE`, distinguished
 * only by the SDK env + API host.
 */
export const CHAIN_ID_TO_RARIBLE_BLOCKCHAIN: Record<number, string> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: 'ETHEREUM',
  [BASE_MAINNET_CHAIN_ID]: 'BASE',
  [BASE_SEPOLIA_CHAIN_ID]: 'BASE',
};

export const CHAIN_ID_TO_RARIBLE_ENV: Record<number, RaribleEnv> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: 'prod',
  [BASE_MAINNET_CHAIN_ID]: 'prod',
  [BASE_SEPOLIA_CHAIN_ID]: 'testnet',
};

export const RARIBLE_API_BASE_PROD = 'https://api.rarible.org';
export const RARIBLE_API_BASE_TESTNET = 'https://testnet-api.rarible.org';
export const RARIBLE_SITE_BASE_PROD = 'https://rarible.com';
export const RARIBLE_SITE_BASE_TESTNET = 'https://testnet.rarible.com';

/**
 * Resolve the Rarible env for a chain from `CHAIN_ID_TO_RARIBLE_ENV` — the
 * single source of truth. Throws on an unsupported chain rather than silently
 * defaulting to prod, so a missing entry surfaces immediately instead of
 * producing misleading downstream API errors.
 */
function getRaribleEnv(chainId: number): RaribleEnv {
  const env = CHAIN_ID_TO_RARIBLE_ENV[chainId];
  if (!env) {
    throw new Error(`Unsupported Rarible chainId: ${chainId}`);
  }
  return env;
}

export function getRaribleApiBaseUrl(chainId: number): string {
  return getRaribleEnv(chainId) === 'testnet'
    ? RARIBLE_API_BASE_TESTNET
    : RARIBLE_API_BASE_PROD;
}

export function getRaribleSiteBaseUrl(chainId: number): string {
  return getRaribleEnv(chainId) === 'testnet'
    ? RARIBLE_SITE_BASE_TESTNET
    : RARIBLE_SITE_BASE_PROD;
}

/**
 * Rarible protocol fee in basis points — off-chain fee preview only. The
 * authoritative fee is applied by Rarible's exchange contract at fill time
 * (the SDK's prepare step exposes the real `baseFee`).
 */
export const RARIBLE_PROTOCOL_FEE_BPS = 100;
