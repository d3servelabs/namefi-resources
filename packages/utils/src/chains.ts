import { isNotNil, pick, pluck, toPairs, values } from 'ramda';
import * as Chains from 'viem/chains';

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
