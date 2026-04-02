import type {
  Address,
  Hex,
  SignableMessage,
  TypedDataDomain,
  TypedDataParameter,
} from 'viem';
import {
  hashMessage,
  hashTypedData,
  parseAbi,
  verifyMessage,
  verifyTypedData,
} from 'viem';
import { getViemPublicClient } from '#lib/crypto/viem-clients';
import { getConfiguredAllowedChainIds } from '#lib/env/allowed-chains';
import { logger } from '#lib/logger';

export const ERC1271_MAGIC_VALUE = '0x1626ba7e' as const;

export const erc1271Abi = parseAbi([
  'function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)',
]);

/**
 * Call `isValidSignature` on an ERC-1271 contract across one or more chains.
 * Returns `true` as soon as any chain returns the magic value.
 */
export async function callIsValidSignature({
  contractAddress,
  hash,
  signature,
  chainIds,
}: {
  contractAddress: Address;
  hash: Hex;
  signature: Hex;
  chainIds?: readonly number[];
}): Promise<boolean> {
  const resolvedChainIds = chainIds ?? getConfiguredAllowedChainIds();

  for (const chainId of new Set(resolvedChainIds)) {
    try {
      const publicClient = getViemPublicClient(chainId);
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: erc1271Abi,
        functionName: 'isValidSignature',
        args: [hash, signature],
      });

      if (result === ERC1271_MAGIC_VALUE) {
        return true;
      }
    } catch (error) {
      logger.trace(
        { chainId, contractAddress, error },
        'isValidSignature call failed on chain %d',
        chainId,
      );
    }
  }

  return false;
}

/**
 * Verify an EIP-712 typed data signature.
 *
 * When `eip1271Account` is provided, hashes the typed data via `hashTypedData`
 * and calls `isValidSignature(hash, signature)` on the contract.
 *
 * When not provided, delegates to viem's `verifyTypedData` (EOA verification).
 */
export async function verifyTypedDataWithEip1271({
  address,
  domain,
  types,
  primaryType,
  message,
  signature,
  eip1271Account,
  chainIds,
}: {
  address: Address;
  domain: TypedDataDomain;
  types: Record<string, readonly TypedDataParameter[]>;
  primaryType: string;
  message: Record<string, unknown>;
  signature: Hex;
  eip1271Account?: Address;
  chainIds?: readonly number[];
}): Promise<boolean> {
  if (eip1271Account) {
    const hash = hashTypedData({
      domain,
      types,
      primaryType,
      message,
    });

    return callIsValidSignature({
      contractAddress: eip1271Account,
      hash,
      signature,
      chainIds,
    });
  }

  return verifyTypedData({
    address,
    domain,
    types,
    primaryType,
    message,
    signature,
  });
}

/**
 * Verify an ERC-191 message signature (used for SIWE / personal_sign).
 *
 * When `eip1271Account` is provided, hashes the message via `hashMessage`
 * and calls `isValidSignature(hash, signature)` on the contract.
 *
 * When not provided, delegates to viem's `verifyMessage` (EOA verification).
 */
export async function verifyMessageWithEip1271({
  address,
  message,
  signature,
  eip1271Account,
  chainIds,
}: {
  address: Address;
  message: SignableMessage;
  signature: Hex;
  eip1271Account?: Address;
  chainIds?: readonly number[];
}): Promise<boolean> {
  if (eip1271Account) {
    const hash = hashMessage(message);

    return callIsValidSignature({
      contractAddress: eip1271Account,
      hash,
      signature,
      chainIds,
    });
  }

  return verifyMessage({
    address,
    message,
    signature,
  });
}
