import * as chains from 'viem/chains';
import { secrets } from '#lib/env';

export function getAlchemyRpcUrl(chainId: number) {
  let host: string;
  switch (chainId) {
    case chains.mainnet.id:
      host = 'eth-mainnet.alchemyapi.io/v2/';
      break;
    case chains.sepolia.id:
      host = 'eth-sepolia.g.alchemy.com/v2/';
      break;
    case chains.goerli.id:
      host = 'eth-goerli.g.alchemy.com/v2/';
      break;
    case chains.polygon.id:
      host = 'polygon-mainnet.g.alchemy.com/v2/';
      break;
    case chains.polygonMumbai.id:
      host = 'polygon-mumbai.g.alchemy.com/v2/';
      break;
    case chains.arbitrum.id:
      host = 'arb-mainnet.g.alchemy.com/v2/';
      break;
    case chains.arbitrumGoerli.id:
      host = 'arb-goerli.g.alchemy.com/v2/';
      break;
    case chains.optimism.id:
      host = 'opt-mainnet.g.alchemy.com/v2/';
      break;
    case chains.optimismGoerli.id:
      host = 'opt-goerli.g.alchemy.com/v2/';
      break;
    case chains.base.id:
      host = 'base-mainnet.g.alchemy.com/v2/';
      break;
    case chains.baseSepolia.id:
      host = 'base-sepolia.g.alchemy.com/v2/';
      break;
    case chains.baseGoerli.id:
      host = 'base-goerli.g.alchemy.com/v2/';
      break;
    default:
      throw new Error('getAlchemyRpcUrl: unsupported-chain');
  }

  return `https://${host}${secrets.ALCHEMY_API_KEY}`;
}
