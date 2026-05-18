import type { Address } from 'viem';
import {
  BASE_MAINNET_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
} from './chains';
import type { ListingCurrency } from './types';

/**
 * Sentinel address representing the chain's native asset (ETH on EVM chains).
 * Seaport's `ItemType.NATIVE` uses this convention.
 */
export const NATIVE_TOKEN_ADDRESS: Address =
  '0x0000000000000000000000000000000000000000';

const ETH: ListingCurrency = {
  contract: NATIVE_TOKEN_ADDRESS,
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  isNative: true,
};

/**
 * Common payment tokens per chain.
 *
 * The first entry is always the chain's native asset (ETH). Addresses are sourced
 * from Circle, Tether, MakerDAO, and Coinbase official deployments.
 */
const CHAIN_CURRENCIES: Record<number, readonly ListingCurrency[]> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: [
    ETH,
    {
      contract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      isNative: false,
    },
    {
      contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
    },
    {
      contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      isNative: false,
    },
    {
      contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      isNative: false,
    },
    {
      contract: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      name: 'Euro Coin',
      symbol: 'EURC',
      decimals: 6,
      isNative: false,
    },
  ],
  [BASE_MAINNET_CHAIN_ID]: [
    ETH,
    {
      contract: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      isNative: false,
    },
    {
      contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
    },
    {
      contract: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      name: 'USD Base Coin (bridged)',
      symbol: 'USDbC',
      decimals: 6,
      isNative: false,
    },
    {
      contract: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      isNative: false,
    },
    {
      contract: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      name: 'Euro Coin',
      symbol: 'EURC',
      decimals: 6,
      isNative: false,
    },
  ],
  [BASE_SEPOLIA_CHAIN_ID]: [
    ETH,
    {
      contract: '0x4200000000000000000000000000000000000006',
      name: 'Wrapped Ether (Base Sepolia)',
      symbol: 'WETH',
      decimals: 18,
      isNative: false,
    },
    {
      contract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      name: 'USD Coin (Base Sepolia, Circle test)',
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
    },
  ],
};

export function getListingCurrenciesForChain(
  chainId: number,
): readonly ListingCurrency[] {
  return CHAIN_CURRENCIES[chainId] ?? [];
}

export function getDefaultListingCurrencyForChain(
  chainId: number,
): ListingCurrency | undefined {
  return CHAIN_CURRENCIES[chainId]?.[0];
}

export function findCurrencyByAddress(
  chainId: number,
  contract: Address,
): ListingCurrency | undefined {
  const lower = contract.toLowerCase();
  return getListingCurrenciesForChain(chainId).find(
    (c) => c.contract.toLowerCase() === lower,
  );
}
