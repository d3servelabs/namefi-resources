import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { CHAINS } from '@namefi-astra/utils/chains';
import { getAlchemyHttpRpcUrl } from '@namefi-astra/utils';
import { clientSideEnv } from './env';

export const supportedChains = [
  CHAINS.mainnet,
  CHAINS.sepolia,
  CHAINS.base,
  CHAINS.baseSepolia,
  CHAINS.robinhoodTestnet,
] as const;

export const getWagmiConfig = () => {
  const generateAlchemyRpcUrlForChain = clientSideEnv.ALCHEMY_FRONTEND_API_KEY
    ? getAlchemyHttpRpcUrl(clientSideEnv.ALCHEMY_FRONTEND_API_KEY)
    : null;

  const getHttpTransport = (chainId: number) => {
    if (generateAlchemyRpcUrlForChain) {
      return http(generateAlchemyRpcUrlForChain(chainId));
    }
    return http();
  };
  return createConfig({
    chains: supportedChains,
    transports: {
      [CHAINS.mainnet.id]: getHttpTransport(CHAINS.mainnet.id),
      [CHAINS.sepolia.id]: getHttpTransport(CHAINS.sepolia.id),
      [CHAINS.base.id]: getHttpTransport(CHAINS.base.id),
      [CHAINS.baseSepolia.id]: getHttpTransport(CHAINS.baseSepolia.id),
      [CHAINS.robinhoodTestnet.id]: getHttpTransport(
        CHAINS.robinhoodTestnet.id,
      ),
    },
  });
};
