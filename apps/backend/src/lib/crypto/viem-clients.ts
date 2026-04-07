import { getChain } from '@namefi-astra/utils';
import { filter, isNotNil } from 'ramda';
import type { Account } from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { secrets } from '#lib/env';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import {
  createViemClientFactory,
  resolveSignerAccount,
} from './viem-client-factory';
import { chainsToUrls } from './rpc-urls';

export const CONFIGURED_CHAINS: readonly Chain[] = filter(
  isNotNil,
  getConfiguredAllowedChainIds().map((chainId) => getChain(chainId) as Chain),
);

let _signerAccount: Account;
export async function getSignerAccount(): Promise<Account> {
  if (_signerAccount) return _signerAccount;
  _signerAccount = await resolveSignerAccount({
    gcpHsmKeyringResourceName: secrets.GCP_HSM_KEYRING_RESOURCE_NAME,
    privateKey: secrets.LOCAL_SIGNER_PRIVATE_KEY,
    mnemonic: secrets.LOCAL_SIGNER_MNEMONIC as string | undefined,
  });
  return _signerAccount;
}

const factory = createViemClientFactory({
  chains: CONFIGURED_CHAINS,
  chainToUrl: chainsToUrls,
  getSignerAccount,
});

export const getViemPublicClient = factory.getPublicClient;
export const getViemWalletClient = factory.getWalletClient;
