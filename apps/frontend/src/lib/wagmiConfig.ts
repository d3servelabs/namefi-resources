import { createConfig } from '@privy-io/wagmi';
import type { Chain } from 'viem';
import { http } from 'wagmi';
import { base, mainnet, sepolia } from 'wagmi/chains';

export const supportedChains: Chain[] = [mainnet, sepolia, base] as const;

export const getWagmiConfig = () => {
  return createConfig({
    chains: [mainnet, ...supportedChains],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [base.id]: http(),
    },
  });
};
