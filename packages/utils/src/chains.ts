import { isNotNil, pick, pluck, toPairs, values } from 'ramda';
import * as _Chains from 'viem/chains';
import type { Chain } from 'viem/chains';

const robinhoodTestnet = {
  /** Collection of block explorers */
  blockExplorers: {
    default: {
      name: 'Robinhood Testnet Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com/',
    },
  },
  /** Collection of contracts */
  contracts: undefined,
  /** ID in number form */
  id: 46630,
  /** Human-readable name */
  name: 'Robinhood Testnet',
  /** Currency used by chain */
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  /** Collection of RPC endpoints */
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.chain.robinhood.com'],
      webSocket: ['wss://feed.testnet.chain.robinhood.com'],
    },
  },
  /** Source Chain ID (ie. the L1 chain) */
  sourceId: _Chains.sepolia.id,
  /** Flag for test networks */
  testnet: true,
} satisfies Chain;

const Chains = {
  ..._Chains,
  robinhoodTestnet,
};

/**
 * Object containing all supported blockchain chains from viem/chains, indexed by name.
 * @remarks [ The module exports other data, but we only need the chains that's why we filter them out by isNotNil(chain.id) ]
 */
export const CHAINS = pick(
  toPairs(Chains)
    .filter(([_, chain]) => isNotNil(chain.id))
    .map(([key]) => key),
  Chains,
);

// export type CHAINS = typeof Chains & Record<string, Chain>

/**
 * Map of chain objects indexed by their chain ID for efficient lookups.
 */
const CHAINS_BY_ID = new Map(values(CHAINS).map((chain) => [chain.id, chain]));

export const CHAINS_IDS = pluck('id', values(Chains)) as number[];

/**
 * Gets a chain object by its chain ID.
 * @param chainId - The numeric ID of the blockchain chain to look up
 * @returns The chain object if found, undefined otherwise
 */
export function getChain(chainId: number) {
  return CHAINS_BY_ID.get(chainId as any);
}

export const TEST_CHAINS = Object.values(CHAINS).filter(
  (chain) => chain.testnet,
);
