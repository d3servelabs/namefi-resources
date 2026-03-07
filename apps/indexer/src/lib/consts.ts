import { CHAINS, type Chain } from '@namefi-astra/utils/chains';

const { mainnet, base, sepolia, robinhoodTestnet } = CHAINS;

export const chainById: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [sepolia.id]: sepolia,
  [robinhoodTestnet.id]: robinhoodTestnet,
};

export const alchemyUrlByChainId: Record<number, string> = {
  [mainnet.id]: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [base.id]: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [robinhoodTestnet.id]: `https://robinhood-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
};

export const startBlockByChainId: Record<number, bigint> = {
  [mainnet.id]: 19_059_949n, // Adjust based on when contract was deployed
  [base.id]: 11_750_288n, // Adjust based on when contract was deployed
  [sepolia.id]: 5_129_892n, // Adjust based on when contract was deployed
  [robinhoodTestnet.id]: 9_652_144n, // Adjust based on when contract was deployed
};

export const expirationChangedEventAddedBlockByChainId: Record<number, bigint> =
  {
    [mainnet.id]: 23_372_427n, // Adjust based on when contract was deployed
    [base.id]: 35_599_223n, // Adjust based on when contract was deployed
    [sepolia.id]: 9_209_071n, // Adjust based on when contract was deployed
    [robinhoodTestnet.id]: 9_652_144n, // Adjust based on when contract was deployed
  };
