import { getChain } from '@namefi-astra/utils';
import { filter, isNotNil } from 'ramda';
import { keccak256, parseSignature, serializeTransaction } from 'viem';
import { type Account, type LocalAccount, toAccount } from 'viem/accounts';
import type { Chain } from 'viem/chains';
import { secrets } from '#lib/env';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import { createLogger } from '#lib/logger';
import {
  createViemClientFactory,
  resolveSignerAccount,
} from './viem-client-factory';
import { chainsToUrls } from './rpc-urls';

const logger = createLogger({ context: 'viem-clients' });

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

let _tempoFeePayerAccount: Account;

function isLocalAccount(
  account: Account,
): account is Extract<Account, { type: 'local' }> {
  return account.type === 'local';
}

function isGcpHsmAccount(
  account: Account,
): account is Extract<Account, { type: 'local'; source: 'gcpHsm' }> {
  return isLocalAccount(account) && account.source === 'gcpHsm';
}

/**
 * Wrap a raw-hash-signing account (e.g. a GCP HSM `LocalAccount`) so that
 * `signTransaction` serializes the transaction, hashes it, and signs via the
 * account's raw `sign({ hash })` primitive. Used as the Tempo fee-payer account;
 * the wrapper keeps the original `publicKey` and tags itself
 * `source: 'customSigner'`.
 */
export function createCustomSigner(account: LocalAccount): Account {
  const sign = account.sign;
  if (!sign) {
    throw new Error('GCP HSM account does not support raw hash signing');
  }

  const customSigner = toAccount({
    address: account.address,
    nonceManager: account.nonceManager,
    async sign({ hash }) {
      logger.debug({ hash }, 'custom signer signing raw hash');
      return sign({ hash });
    },
    async signMessage({ message }) {
      logger.debug({ message }, 'custom signer signing message');
      return account.signMessage({ message });
    },
    async signTransaction(
      transaction,
      { serializer = serializeTransaction } = {},
    ) {
      logger.debug({ transaction }, 'custom signer signing transaction');
      const signableTransaction = (() => {
        if (transaction.type === 'eip4844') {
          return {
            ...transaction,
            sidecars: false,
          };
        }

        return transaction;
      })();

      const hash = keccak256(await serializer(signableTransaction));
      const signature = parseSignature(await sign({ hash }));

      return serializer(transaction, signature);
    },
    async signTypedData(typedData) {
      return account.signTypedData(typedData);
    },
  });

  return {
    ...customSigner,
    publicKey: account.publicKey,
    source: 'customSigner',
  } as Account;
}

export async function getTempoFeePayerAccount(): Promise<Account> {
  if (_tempoFeePayerAccount) return _tempoFeePayerAccount;

  const signerAccount = await getSignerAccount();
  _tempoFeePayerAccount = isGcpHsmAccount(signerAccount)
    ? createCustomSigner(signerAccount)
    : signerAccount;

  return _tempoFeePayerAccount;
}
