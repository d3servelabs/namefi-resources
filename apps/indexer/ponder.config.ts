import { secrets } from './src/lib/env';
import { createConfig } from 'ponder';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { CHAINS, type Chain } from '@namefi-astra/utils/chains';
import { switchCaseOrDefault } from '@namefi-astra/utils/match';
import type { ChainConfig } from 'ponder';

const ALCHEMY_API_KEY = secrets.ALCHEMY_API_KEY;
const DEV = process.env.DEV === 'true';
const LOCAL_DB = process.env.LOCAL_DB === 'true';
const LISTEN_TO_ACCOUNTS = false;
const NAMEFI_NFT_CONTRACT_ADDRESS =
  '0x0000000000cf80e7cf8fa4480907f692177f8e06';

const getChainConfig = (
  chain: Chain,
  options?: { useWebsockets?: boolean; pollingIntervalMs?: number },
) => {
  const useWebsockets =
    options?.useWebsockets ??
    secrets.CHAINS_CONFIG?.[chain.id]?.useWebsockets ??
    secrets.USE_WEBSOCKETS;
  const pollingInterval = useWebsockets
    ? undefined
    : (options?.pollingIntervalMs ??
      secrets.CHAINS_CONFIG?.[chain.id]?.pollingIntervalMs);

  const chainRpcSubdomain = switchCaseOrDefault(
    chain.id,
    {
      [CHAINS.mainnet.id]: 'eth-mainnet',
      [CHAINS.base.id]: 'base-mainnet',
      [CHAINS.sepolia.id]: 'eth-sepolia',
      [CHAINS.robinhoodTestnet.id]: 'robinhood-testnet',
    },
    'unsupported-chain',
  );

  console.log(`Chain config: ${chain.name}`, {
    useWebsockets,
    pollingInterval,
  });

  return {
    id: chain.id,
    rpc: `https://${chainRpcSubdomain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    ws: useWebsockets
      ? `wss://${chainRpcSubdomain}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : undefined,
    pollingInterval,
  } as ChainConfig;
};

const DATABASE_URL = secrets.DATABASE_URL;
const MINUTE_MS = 60 * 1000;

export default createConfig({
  ordering: 'multichain',
  database: LOCAL_DB
    ? {
        kind: 'pglite',
      }
    : {
        kind: 'postgres',
        connectionString: DATABASE_URL,
      },
  chains: DEV
    ? {
        sepolia: getChainConfig(CHAINS.sepolia),
        robinhoodTestnet: getChainConfig(CHAINS.robinhoodTestnet, {
          useWebsockets: false,
          pollingIntervalMs: 5 * MINUTE_MS,
        }),
      }
    : {
        mainnet: getChainConfig(CHAINS.mainnet),
        base: getChainConfig(CHAINS.base),
        // robinhoodTestnet: getChainConfig(CHAINS.robinhoodTestnet),
        sepolia: getChainConfig(CHAINS.sepolia, {
          useWebsockets: false,
          pollingIntervalMs: 5 * MINUTE_MS,
        }),
      },
  accounts: getAccounts(),
  contracts: {
    NamefiNft: {
      abi: NftAbi,
      address: NAMEFI_NFT_CONTRACT_ADDRESS,
      chain: DEV
        ? {
            sepolia: {
              includeCallTraces: false,
              includeTransactionReceipts: false,
              startBlock: 'latest', // Adjust based on when contract was deployed
            },
            robinhoodTestnet: {
              includeCallTraces: false,
              includeTransactionReceipts: false,
              startBlock: 'latest', // Adjust based on when contract was deployed
            },
          }
        : {
            mainnet: {
              includeCallTraces: false,
              includeTransactionReceipts: false,
              startBlock: 'latest', // Adjust based on when contract was deployed
            },
            base: {
              includeCallTraces: false,
              includeTransactionReceipts: false,
              startBlock: 'latest', // Adjust based on when contract was deployed
            },
            sepolia: {
              includeCallTraces: false,
              includeTransactionReceipts: false,
              startBlock: 'latest', // Adjust based on when contract was deployed
            },
          },
    },
  },
});

type AccountsConfig = Parameters<typeof createConfig>[0]['accounts'];
function getAccounts(): AccountsConfig {
  if (!LISTEN_TO_ACCOUNTS) {
    return undefined;
  }
  return {
    NamefiNftAccount: {
      address: NAMEFI_NFT_CONTRACT_ADDRESS,
      chain: {
        mainnet: {
          startBlock: 'latest',
        },
        base: {
          startBlock: 'latest',
        },
        sepolia: {
          startBlock: 'latest',
        },
      },
    },
  };
}
