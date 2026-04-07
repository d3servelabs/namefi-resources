/**
 * x402 Viem Clients
 *
 * Similar to viem-clients.ts but specifically for x402 payment operations.
 * Uses X402_SIGNER_* secrets for signing refund transactions.
 */

import { switchCase } from '@namefi-astra/utils';
import type { Account } from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import { secrets } from '#lib/env';
import {
  createViemClientFactory,
  resolveSignerAccount,
} from './viem-client-factory';

// Chains supported for x402 USDC operations
const X402_SUPPORTED_CHAINS: readonly Chain[] = [
  base,
  baseSepolia,
  mainnet,
  sepolia,
];

// RPC URLs for x402 chains
const x402ChainsToUrls = (chain: Chain): string => {
  const chainUrl = switchCase(chain.id, {
    [base.id]: `https://base-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [baseSepolia.id]: `https://base-sepolia.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [mainnet.id]: `https://eth-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  } as Record<number, string>);

  if (!chainUrl) {
    throw new Error(`No chain URL found for x402 chain ${chain.id}`);
  }
  return chainUrl;
};

let _x402SignerAccount: Account;
async function getX402SignerAccount(): Promise<Account> {
  if (_x402SignerAccount) return _x402SignerAccount;
  _x402SignerAccount = await resolveSignerAccount({
    gcpHsmKeyringResourceName:
      secrets.X402_SIGNER_GCP_HSM_KEYRING_RESOURCE_NAME,
    privateKey: secrets.X402_SIGNER_PRIVATE_KEY,
    mnemonic: secrets.X402_SIGNER_MNEMONIC as string | undefined,
  });
  return _x402SignerAccount;
}

const factory = createViemClientFactory({
  chains: X402_SUPPORTED_CHAINS,
  chainToUrl: x402ChainsToUrls,
  getSignerAccount: getX402SignerAccount,
});

export const getX402PublicClient = factory.getPublicClient;
export const getX402WalletClient = factory.getWalletClient;

/**
 * USDC contract addresses by chain ID
 */
export const USDC_CONTRACTS: Record<number, `0x${string}`> = {
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
};

/**
 * Get USDC contract address for a chain
 */
export const getUsdcContractAddress = (chainId: number): `0x${string}` => {
  const address = USDC_CONTRACTS[chainId];
  if (!address) {
    throw new Error(`No USDC contract address for chain ${chainId}`);
  }
  return address;
};
