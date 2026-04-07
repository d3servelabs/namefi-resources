/**
 * Shared factory for creating singleton-cached viem public and wallet clients.
 *
 * Both `viem-clients.ts` and `x402-viem-clients.ts` use identical patterns for
 * singleton caching, signer resolution (GCP HSM / private key / mnemonic), and
 * client map creation. This module extracts that shared logic.
 */

import { gcpHsmToAccount } from '@valora/viem-account-hsm-gcp';
import { fromPairs, map } from 'ramda';
import { http, createPublicClient, createWalletClient } from 'viem';
import {
  type Account,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { createNonceManager, jsonRpc } from 'viem/nonce';

// ---------------------------------------------------------------------------
// Signer resolution
// ---------------------------------------------------------------------------

export interface SignerSecrets {
  gcpHsmKeyringResourceName?: string;
  privateKey?: string;
  mnemonic?: string;
}

/**
 * Resolve a viem `Account` from the first available signer secret.
 * Priority: GCP HSM > private key > mnemonic.
 */
export async function resolveSignerAccount(
  secrets: SignerSecrets,
): Promise<Account> {
  const { gcpHsmKeyringResourceName, privateKey, mnemonic } = secrets;

  if (!(gcpHsmKeyringResourceName || privateKey || mnemonic)) {
    throw new Error('Signer configuration missing');
  }

  const nonceManager = createNonceManager({ source: jsonRpc() });

  if (gcpHsmKeyringResourceName) {
    return gcpHsmToAccount({
      hsmKeyVersion: gcpHsmKeyringResourceName,
    });
  }

  if (privateKey) {
    return privateKeyToAccount(privateKey as `0x${string}`, { nonceManager });
  }

  if (mnemonic) {
    return mnemonicToAccount(mnemonic, { nonceManager });
  }

  // Unreachable – the guard above catches this, but TS needs it.
  throw new Error('Signer configuration missing');
}

// ---------------------------------------------------------------------------
// Client factory with singleton caching
// ---------------------------------------------------------------------------

export interface ViemClientFactoryOptions {
  /** The set of chains to create clients for. */
  chains: readonly Chain[];
  /** Given a chain, return its RPC URL. */
  chainToUrl: (chain: Chain) => string;
  /** Async function that returns the signer account for wallet clients. */
  getSignerAccount: () => Promise<Account>;
}

export interface ViemClientFactory {
  getPublicClient: (chainId: number) => ReturnType<typeof createPublicClient>;
  getWalletClient: (
    chainId: number,
  ) => Promise<ReturnType<typeof createWalletClient>>;
}

/**
 * Build a pair of `getPublicClient` / `getWalletClient` accessors that lazily
 * create and cache client maps keyed by chain ID.
 */
export function createViemClientFactory(
  opts: ViemClientFactoryOptions,
): ViemClientFactory {
  const { chains, chainToUrl, getSignerAccount } = opts;

  let publicClients: Record<
    number,
    ReturnType<typeof createPublicClient>
  > | null = null;
  let walletClients: Record<
    number,
    ReturnType<typeof createWalletClient>
  > | null = null;

  const buildPublicClients = () =>
    fromPairs(
      map(
        (chain) => [
          chain.id,
          createPublicClient({ transport: http(chainToUrl(chain)), chain }),
        ],
        chains,
      ),
    );

  const buildWalletClients = async () => {
    const account = await getSignerAccount();
    return fromPairs(
      map(
        (chain) => [
          chain.id,
          createWalletClient({
            transport: http(chainToUrl(chain)),
            account,
            chain,
          }),
        ],
        chains,
      ),
    );
  };

  const assertChainConfigured = (chainId: number, label: string) => {
    if (!chains.some((c) => c.id === chainId)) {
      throw new Error(`Chain ${chainId} is not configured for ${label}`);
    }
  };

  return {
    getPublicClient(chainId: number) {
      assertChainConfigured(chainId, 'public client');
      if (!publicClients) {
        publicClients = buildPublicClients();
      }
      return publicClients[chainId];
    },

    async getWalletClient(chainId: number) {
      assertChainConfigured(chainId, 'wallet client');
      if (!walletClients) {
        walletClients = await buildWalletClients();
      }
      return walletClients[chainId];
    },
  };
}
