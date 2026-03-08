import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains';
import { CHAINS } from '@namefi-astra/utils/chains';

export const supportedChains = [
  mainnet,
  sepolia,
  base,
  baseSepolia,
  CHAINS.robinhoodTestnet,
] as const;

export const getWagmiConfig = () => {
  return createConfig({
    chains: supportedChains,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [CHAINS.robinhoodTestnet.id]: http(),
    },
  });
};
