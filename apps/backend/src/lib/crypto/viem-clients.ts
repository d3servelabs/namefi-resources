import { getChain } from '@namefi-astra/utils';
import { gcpHsmToAccount } from '@valora/viem-account-hsm-gcp';
import { filter, fromPairs, isNotNil, map } from 'ramda';
import { http, createPublicClient, createWalletClient } from 'viem';
import {
  type Account,
  mnemonicToAccount,
  privateKeyToAccount,
} from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { createNonceManager, jsonRpc } from 'viem/nonce';
import { secrets } from '#lib/env';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import { chainsToUrls } from './rpc-urls';

export const CONFIGURED_CHAINS: readonly Chain[] = filter(
  isNotNil,
  getConfiguredAllowedChainIds().map((chainId) => getChain(chainId) as Chain),
);

let publicClients: Awaited<ReturnType<typeof createPublicClients>> | null =
  null;
let walletClients: Awaited<ReturnType<typeof createWalletClients>> | null =
  null;
// Create clients factory
const createPublicClients = () => {
  const publicClients = fromPairs(
    map(
      (chain) => [
        chain.id,
        createPublicClient({
          transport: http(chainsToUrls(chain)),
          chain,
        }),
      ],
      CONFIGURED_CHAINS,
    ),
  );

  return publicClients;
};

const createWalletClients = async () => {
  if (
    !(
      secrets.GCP_HSM_KEYRING_RESOURCE_NAME ||
      secrets.LOCAL_SIGNER_PRIVATE_KEY ||
      secrets.LOCAL_SIGNER_MNEMONIC
    )
  ) {
    throw new Error('Signer configuration missing');
  }

  const nonceManager = createNonceManager({
    source: jsonRpc(),
  });

  let signerAccount: Account;
  if (secrets.GCP_HSM_KEYRING_RESOURCE_NAME) {
    signerAccount = await gcpHsmToAccount({
      hsmKeyVersion: secrets.GCP_HSM_KEYRING_RESOURCE_NAME,
    });
  } else if (secrets.LOCAL_SIGNER_PRIVATE_KEY) {
    signerAccount = privateKeyToAccount(
      secrets.LOCAL_SIGNER_PRIVATE_KEY as `0x${string}`,
      {
        nonceManager,
      },
    );
  } else if (secrets.LOCAL_SIGNER_MNEMONIC) {
    signerAccount = mnemonicToAccount(secrets.LOCAL_SIGNER_MNEMONIC as string, {
      nonceManager,
    });
  } else {
    throw new Error('Signer configuration missing');
  }

  const walletClients = fromPairs(
    map(
      (chain) => [
        chain.id,
        createWalletClient({
          transport: http(chainsToUrls(chain)),
          account: signerAccount,
          chain,
        }),
      ],
      CONFIGURED_CHAINS,
    ),
  );
  return walletClients;
};

export const getViemPublicClient = (chainId: number) => {
  if (!CONFIGURED_CHAINS.some((chain) => chain.id === chainId)) {
    throw new Error(`Chain ${chainId} is not configured`);
  }
  if (!publicClients) {
    publicClients = createPublicClients();
  }
  return publicClients[chainId];
};

export const getViemWalletClient = async (chainId: number) => {
  if (!CONFIGURED_CHAINS.some((chain) => chain.id === chainId)) {
    throw new Error(`Chain ${chainId} is not configured`);
  }
  if (!walletClients) {
    walletClients = await createWalletClients();
  }
  return walletClients[chainId];
};
