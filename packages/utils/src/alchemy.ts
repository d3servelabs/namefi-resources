import { switchCase } from './match';
import { CHAINS } from './chains';

export const getAlchemyHttpRpcUrl = (apiKey: string) => (chainId: number) => {
  const chainUrl = switchCase(chainId, {
    [CHAINS.base.id]: `https://base-mainnet.g.alchemy.com/v2/${apiKey}`,
    [CHAINS.mainnet.id]: `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
    [CHAINS.sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`,
    [CHAINS.baseSepolia.id]: `https://base-sepolia.g.alchemy.com/v2/${apiKey}`,
    [CHAINS.robinhoodTestnet.id]:
      `https://robinhood-testnet.g.alchemy.com/v2/${apiKey}`,
  } as Record<number, string>);

  if (!chainUrl) {
    throw new Error(`No chain URL found for chain ${chainId}`);
  }
  return chainUrl;
};
