import { createConfig } from 'ponder';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { base, type Chain, mainnet, sepolia } from 'viem/chains';
import { secrets } from './src/lib/env';
import { switchCaseOrDefault } from '@namefi-astra/utils/match';
import type { ChainConfig } from 'ponder';
import { isNotNil } from 'ramda';

const ALCHEMY_API_KEY = secrets.ALCHEMY_API_KEY;
const DEV = false;
const NAMEFI_NFT_CONTRACT_ADDRESS =
  '0x0000000000cf80e7cf8fa4480907f692177f8e06';

const getChainConfig = (
  chain: Chain,
  options: { useWebsockets?: boolean; pollingIntervalMs?: number } = {},
) => {
  const chainRpcSubdomain = switchCaseOrDefault(
    chain.id,
    {
      [mainnet.id]: 'eth-mainnet',
      [base.id]: 'base-mainnet',
      [sepolia.id]: 'eth-sepolia',
    },
    'unsupported-chain',
  );

  const pollingInterval = options.pollingIntervalMs;
  const useWebsockets =
    options.useWebsockets ??
    (isNotNil(pollingInterval) ? false : secrets.USE_WEBSOCKETS);
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
  database: DEV
    ? {
        kind: 'pglite',
      }
    : {
        kind: 'postgres',
        connectionString: DATABASE_URL,
      },
  chains: {
    mainnet: getChainConfig(mainnet, { pollingIntervalMs: MINUTE_MS }),
    base: getChainConfig(base, { pollingIntervalMs: 0.5 * MINUTE_MS }),
    sepolia: getChainConfig(sepolia, { pollingIntervalMs: 5 * MINUTE_MS }),
  },
  accounts: {
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
  },
  contracts: {
    NamefiNft: {
      abi: NftAbi,
      address: NAMEFI_NFT_CONTRACT_ADDRESS,
      chain: {
        mainnet: {
          startBlock: 'latest', // Adjust based on when contract was deployed
        },
        base: {
          startBlock: 'latest', // Adjust based on when contract was deployed
        },
        sepolia: {
          startBlock: 'latest', // Adjust based on when contract was deployed
        },
      },
    },
  },
});
