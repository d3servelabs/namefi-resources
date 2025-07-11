import { switchCase } from '@namefi-astra/utils';
import { base, mainnet, sepolia } from 'viem/chains';
import type { Chain } from 'viem/chains';
import { secrets } from '#lib/env';

export const chainsToUrls = (chain: Chain) => {
  const chainUrl = switchCase(chain.id, {
    [base.id]: `https://base-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [mainnet.id]: `https://eth-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  } as Record<number, string>);

  if (!chainUrl) {
    throw new Error(`No chain URL found for chain ${chain.id}`);
  }
  return chainUrl;
};
