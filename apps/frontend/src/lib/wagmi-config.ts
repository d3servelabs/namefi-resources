import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';

export const supportedChains = [mainnet, sepolia, base, baseSepolia] as const;

export const getWagmiConfig = () => {
  return createConfig({
    chains: supportedChains,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  });
};
