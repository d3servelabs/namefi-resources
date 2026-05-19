import {
  base,
  baseSepolia,
  mainnet,
  sepolia,
  tempo,
  tempoModerato,
} from 'viem/chains';
import type { Chain as ViemChain } from 'viem/chains';
export type { Chain } from 'viem/chains';

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
  sourceId: sepolia.id,
  /** Flag for test networks */
  testnet: true,
} satisfies ViemChain;

/**
 * Keep this registry explicit. A namespace import from `viem/chains` pulls every
 * chain definition into frontend route graphs even when the app uses only this set.
 */
export const CHAINS = {
  mainnet,
  sepolia,
  base,
  baseSepolia,
  tempo,
  tempoModerato,
  robinhoodTestnet,
} as const satisfies Record<string, ViemChain>;

const CHAINS_LIST = Object.values(CHAINS);

/**
 * Map of chain objects indexed by their chain ID for efficient lookups.
 */
const CHAINS_BY_ID = new Map(CHAINS_LIST.map((chain) => [chain.id, chain]));

export const CHAINS_IDS = CHAINS_LIST.map((chain) => chain.id) as number[];

/**
 * Gets a chain object by its chain ID.
 * @param chainId - The numeric ID of the blockchain chain to look up
 * @returns The chain object if found, undefined otherwise
 */
export function getChain(chainId: number) {
  return CHAINS_BY_ID.get(chainId);
}

export const TEST_CHAINS = CHAINS_LIST.filter((chain) => chain.testnet);
