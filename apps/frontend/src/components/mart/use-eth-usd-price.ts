'use client';

import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { useConfig } from 'wagmi';
import { getPublicClient } from 'wagmi/actions';
import { ETHEREUM_MAINNET_CHAIN_ID } from '@/lib/marketplaces/chains';

/**
 * Chainlink ETH/USD price feed on Ethereum mainnet. Used as the canonical
 * "ETH is worth $X right now" source for the `/mart` cards. ETH is the same
 * asset on every chain we list, so a single mainnet feed is sufficient — we
 * don't need a per-chain oracle.
 *
 * @see https://docs.chain.link/data-feeds/price-feeds/addresses
 */
const CHAINLINK_ETH_USD_FEED: Address =
  '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

/**
 * Chainlink USD-quoted feeds report prices with 8 decimals. Hard-coded rather
 * than read via `decimals()` to save a round-trip — it's a fixed property of
 * the aggregator, not something that changes between rounds.
 */
const CHAINLINK_FEED_DECIMALS = 8;

const AGGREGATOR_V3_ABI = [
  {
    name: 'latestRoundData',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
  },
] as const;

/**
 * Current ETH→USD price (US dollars per 1 ETH) from the Chainlink mainnet feed,
 * or `null` while loading / if the read fails. Cards multiply a listing's ETH
 * `decimal` by this to show an approximate fiat value.
 *
 * Read-only display helper — never use the result for on-chain math.
 */
export function useEthUsdPrice(enabled = true): number | null {
  const config = useConfig();

  const { data } = useQuery({
    queryKey: ['eth-usd-price', CHAINLINK_ETH_USD_FEED],
    enabled,
    // The displayed fiat value only needs to be roughly current; a 5-minute
    // cache keeps the grid from re-reading the feed on every navigation.
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<number | null> => {
      const publicClient = getPublicClient(config, {
        chainId: ETHEREUM_MAINNET_CHAIN_ID,
      });
      if (!publicClient) return null;
      const [, answer] = await publicClient.readContract({
        address: CHAINLINK_ETH_USD_FEED,
        abi: AGGREGATOR_V3_ABI,
        functionName: 'latestRoundData',
      });
      if (answer <= 0n) return null;
      return Number(answer) / 10 ** CHAINLINK_FEED_DECIMALS;
    },
  });

  return data ?? null;
}
