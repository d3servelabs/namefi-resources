/**
 * x402 Viem Clients
 *
 * Similar to viem-clients.ts but specifically for x402 payment operations.
 * Uses X402_SIGNER_* secrets for signing refund transactions.
 */

import { getChain, switchCase } from '@namefi-astra/utils';
import { gcpHsmToAccount } from '@valora/viem-account-hsm-gcp';
import { filter, fromPairs, isNotNil, map } from 'ramda';
import { http, createPublicClient, createWalletClient } from 'viem';
import {
  type Account,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { base, baseSepolia, mainnet, sepolia } from 'viem/chains';
import { createNonceManager, jsonRpc } from 'viem/nonce';
import { config, secrets } from '#lib/env';

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

let x402PublicClients: Awaited<
  ReturnType<typeof createX402PublicClients>
> | null = null;
let x402WalletClients: Awaited<
  ReturnType<typeof createX402WalletClients>
> | null = null;

const createX402PublicClients = () => {
  const publicClients = fromPairs(
    map(
      (chain) => [
        chain.id,
        createPublicClient({
          transport: http(x402ChainsToUrls(chain)),
          chain,
        }),
      ],
      X402_SUPPORTED_CHAINS,
    ),
  );

  return publicClients;
};

const createX402WalletClients = async () => {
  if (
    !(
      secrets.X402_SIGNER_GCP_HSM_KEYRING_RESOURCE_NAME ||
      secrets.X402_SIGNER_PRIVATE_KEY ||
      secrets.X402_SIGNER_MNEMONIC
    )
  ) {
    throw new Error(
      'X402 signer configuration missing. Set one of: X402_SIGNER_GCP_HSM_KEYRING_RESOURCE_NAME, X402_SIGNER_PRIVATE_KEY, or X402_SIGNER_MNEMONIC',
    );
  }

  const nonceManager = createNonceManager({
    source: jsonRpc(),
  });

  let signerAccount: Account;
  if (secrets.X402_SIGNER_GCP_HSM_KEYRING_RESOURCE_NAME) {
    signerAccount = await gcpHsmToAccount({
      hsmKeyVersion: secrets.X402_SIGNER_GCP_HSM_KEYRING_RESOURCE_NAME,
    });
  } else if (secrets.X402_SIGNER_PRIVATE_KEY) {
    signerAccount = privateKeyToAccount(
      secrets.X402_SIGNER_PRIVATE_KEY as `0x${string}`,
      {
        nonceManager,
      },
    );
  } else if (secrets.X402_SIGNER_MNEMONIC) {
    signerAccount = mnemonicToAccount(secrets.X402_SIGNER_MNEMONIC as string, {
      nonceManager,
    });
  } else {
    throw new Error('X402 signer configuration missing');
  }

  const walletClients = fromPairs(
    X402_SUPPORTED_CHAINS.map((chain) => [
      chain.id,
      createWalletClient({
        transport: http(x402ChainsToUrls(chain)),
        account: signerAccount,
        chain,
      }),
    ]),
  );
  return walletClients;
};

export const getX402PublicClient = (chainId: number) => {
  if (!X402_SUPPORTED_CHAINS.some((chain) => chain.id === chainId)) {
    throw new Error(`Chain ${chainId} is not supported for x402 operations`);
  }
  if (!x402PublicClients) {
    x402PublicClients = createX402PublicClients();
  }
  return x402PublicClients[chainId];
};

export const getX402WalletClient = async (chainId: number) => {
  if (!X402_SUPPORTED_CHAINS.some((chain) => chain.id === chainId)) {
    throw new Error(`Chain ${chainId} is not supported for x402 operations`);
  }
  if (!x402WalletClients) {
    x402WalletClients = await createX402WalletClients();
  }
  return x402WalletClients[chainId];
};

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
