import { switchCase } from '@namefi-astra/utils';
import { CHAINS } from '@namefi-astra/utils/chains';
import type { Chain } from 'viem/chains';
import { secrets } from '#lib/env';

export const chainsToUrls = (chain: Chain) => {
  const chainUrl = switchCase(chain.id, {
    [CHAINS.base.id]:
      `https://base-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [CHAINS.mainnet.id]:
      `https://eth-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [CHAINS.sepolia.id]:
      `https://eth-sepolia.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [CHAINS.baseSepolia.id]:
      `https://base-sepolia.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [CHAINS.robinhoodTestnet.id]:
      `https://robinhood-testnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  } as Record<number, string>);

  if (!chainUrl) {
    throw new Error(`No chain URL found for chain ${chain.id}`);
  }
  return chainUrl;
};
