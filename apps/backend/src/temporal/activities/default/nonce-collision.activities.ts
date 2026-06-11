/**
 * Read-only nonce-collision check, as a DEFAULT-queue activity.
 *
 * Wraps `checkNonceConsumed` (`#lib/crypto/nonce-collision-detection`) for use
 * from a workflow: it resolves the signer's public client + address by
 * `signerKind`, runs the check, and maps the result to a Temporal-safe shape
 * (no bigints). The orchestrator calls this BEFORE re-pinning a fresh nonce, to
 * make sure the original broadcast was not in fact already sent (a transport
 * failure after node acceptance leaves no local tx hash — review finding #1).
 */

import { Context } from '@temporalio/activity';
import type { Address, Hash, Hex, PublicClient } from 'viem';
import { checkNonceConsumed } from '#lib/crypto/nonce-collision-detection';
import {
  getViemPublicClient,
  getViemWalletClient,
} from '#lib/crypto/viem-clients';
import {
  getX402PublicClient,
  getX402WalletClient,
} from '#lib/crypto/x402-viem-clients';

export type SignerKind = 'mint' | 'x402';

/** Temporal-safe projection of `NonceCheckResult` — bigints rendered as strings. */
export type NonceAlreadySentResult =
  | { status: 'unused' }
  | {
      status: 'matched';
      txHash: Hash;
      receiptStatus: 'success' | 'reverted' | null;
      blockNumber: string | null;
    }
  | { status: 'conflict'; txHash: Hash; to: Address | null; onChainData: Hex }
  | { status: 'consumed_unidentified'; nonce: number; onChainNonce: number };

export interface CheckNonceAlreadySentInput {
  signerKind: SignerKind;
  chainId: number;
  /** The pinned nonce we are about to abandon. */
  nonce: number;
  /** The calldata we intended to send. */
  expectedData: Hex;
  /** The destination we intended to call. */
  contractAddress: Address;
  /** Block height at send time (decimal string), to bound the scan. Optional. */
  fromBlock?: string;
}

export async function checkNonceAlreadySent(
  input: CheckNonceAlreadySentInput,
): Promise<NonceAlreadySentResult> {
  const ctx = Context.current();
  const {
    signerKind,
    chainId,
    nonce,
    expectedData,
    contractAddress,
    fromBlock,
  } = input;

  const publicClient = (
    signerKind === 'x402'
      ? getX402PublicClient(chainId)
      : getViemPublicClient(chainId)
  ) as PublicClient;
  const walletClient =
    signerKind === 'x402'
      ? await getX402WalletClient(chainId)
      : await getViemWalletClient(chainId);
  const signer = walletClient.account.address;

  const result = await checkNonceConsumed(publicClient, {
    signer,
    nonce,
    expectedData,
    contractAddress,
    fromBlock: fromBlock !== undefined ? BigInt(fromBlock) : undefined,
  });

  ctx.log.info(
    `[nonce-collision] signerKind=${signerKind} signer=${signer} nonce=${nonce} → ${result.status}`,
  );

  switch (result.status) {
    case 'unused':
      return { status: 'unused' };
    case 'matched':
      return {
        status: 'matched',
        txHash: result.txHash,
        receiptStatus: result.receipt?.status ?? null,
        blockNumber: result.receipt?.blockNumber?.toString() ?? null,
      };
    case 'conflict':
      return {
        status: 'conflict',
        txHash: result.txHash,
        to: result.to,
        onChainData: result.onChainData,
      };
    case 'consumed_unidentified':
      return {
        status: 'consumed_unidentified',
        nonce: result.nonce,
        onChainNonce: result.onChainNonce,
      };
  }
}
