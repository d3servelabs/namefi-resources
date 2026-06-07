/**
 * Shared Ethereum transaction primitives (send / confirm / nonce).
 *
 * These are the building blocks of the pinned-nonce staggered-parallel race
 * (see `shared/workflow-helpers/staggered-send-race.ts`). They deliberately
 * SPLIT "sign + send" from "wait for confirmation":
 *
 *  - `sendPreparedTransaction` broadcasts with an EXPLICIT, caller-pinned nonce
 *    and returns the tx hash immediately — it never waits for a receipt.
 *  - `getTransactionConfirmation` is a read-only poll over candidate hashes.
 *  - `getSignerNonce` pins the nonce once per workflow.
 *
 * Reusing ONE nonce for every replacement is what makes minting idempotent:
 * Ethereum mines at most one transaction per (account, nonce), so broadcasting
 * several escalating-gas replacements can never double-mint.
 *
 * Both the mint signer and the x402 signer instantiate this factory with their
 * own viem clients (and gas cap) — see `mint/mint-tx.activities.ts` and
 * `x402-tx.activities.ts`.
 */

import { Context } from '@temporalio/activity';
import { BigNumber } from 'bignumber.js';
import type {
  EstimateGasErrorType,
  GetGasPriceErrorType,
  Hash,
  PrepareTransactionRequestReturnType,
  SendTransactionErrorType,
} from 'viem';
import type { ViemClientFactory } from '#lib/crypto/viem-client-factory';
import { resolve } from '../../../utils/resolve';
import type { PreparedTxOnlySerializableParams } from '../mint/mint.activities';

/**
 * Result of a single broadcast attempt. There is no `SUCCESS` — confirmation is
 * a separate concern handled by `getTransactionConfirmation`.
 */
export type TxSendOnlyResult =
  | { status: 'SENT'; txHash: Hash }
  // Benign-in-race: the pinned nonce is already taken — by a sibling lane that
  // broadcast first, or by the tx that ultimately mines. The confirmation
  // poller decides the final outcome; lanes MUST NOT treat these as fatal.
  | {
      status: 'NONCE_EXPIRED' | 'REPLACEMENT_UNDERPRICED' | 'GAS_PRICE_TOO_LOW';
      error: string;
    }
  // Fatal for THIS lane only (siblings + poller keep going).
  | {
      status:
        | 'FAILED_TO_ESTIMATE_GAS'
        | 'UNPREDICTABLE_GAS_LIMIT'
        | 'FAILED_TO_GET_GAS_PRICE'
        | 'INSUFFICIENT_FUNDS'
        | 'FAILED_TO_SEND_TRANSACTION';
      error: string;
    };

/** Result of a read-only confirmation poll over a set of candidate hashes. */
export type TxConfirmationResult =
  | {
      kind: 'CONFIRMED';
      winner: Hash;
      blockNumber: string;
      confirmations: number;
    }
  | { kind: 'REVERTED'; reverted: Hash; blockNumber: string }
  | { kind: 'PENDING' }
  // The nonce slot was consumed on-chain but none of OUR candidate hashes mined
  // (foreign/"stolen" nonce, or our receipt is lagging on this RPC node).
  | { kind: 'NONCE_FILLED_NO_CANDIDATE'; onChainNonce: number }
  // Defensive — impossible with a single pinned nonce.
  | { kind: 'MULTIPLE_CONFIRMED'; winners: Hash[] };

export interface SignerClientBundle {
  getPublicClient: ViemClientFactory['getPublicClient'];
  getWalletClient: ViemClientFactory['getWalletClient'];
  /** Absolute cap applied to the gas-price multiplier (chain-aware). */
  resolveMaxGasPriceMultiplier: (chainId: number) => Promise<number>;
}

export interface EthTxPrimitives {
  getSignerNonce: (chainId: number) => Promise<number>;
  sendPreparedTransaction: (
    preparedTx: PreparedTxOnlySerializableParams,
    chainId: number,
    nonce: number,
    gasPriceMultiplier: number,
  ) => Promise<TxSendOnlyResult>;
  getTransactionConfirmation: (
    txHashes: Hash[],
    chainId: number,
    pinnedNonce: number,
    confirmations: number,
  ) => Promise<TxConfirmationResult>;
}

function multiplyBigIntByFraction(
  value: bigint,
  fractionalNumber: number,
): bigint {
  return BigInt(
    BigNumber(value.toString()).multipliedBy(fractionalNumber).toFixed(0),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Map a viem send error onto our typed result. Mirrors the classification that
 * lived inline in the legacy `signAndSendTransaction`, plus `INSUFFICIENT_FUNDS`
 * and a coarse `GAS_PRICE_TOO_LOW` fallback.
 */
function classifySendError(error: SendTransactionErrorType): TxSendOnlyResult {
  const message = errorMessage(error);
  const details =
    typeof (error as { details?: unknown }).details === 'string'
      ? ((error as { details?: string }).details as string)
      : undefined;
  const cause = (error as { cause?: { name?: string; details?: string } })
    .cause;
  const causeDetails =
    typeof cause?.details === 'string' ? cause.details : undefined;
  const causeName = cause?.name;

  if (
    details === 'replacement transaction underpriced' ||
    causeDetails === 'replacement transaction underpriced'
  ) {
    return { status: 'REPLACEMENT_UNDERPRICED', error: message };
  }
  if (
    causeName === 'NonceTooLowError' ||
    details?.startsWith('nonce too low') ||
    /nonce too low/i.test(message)
  ) {
    return { status: 'NONCE_EXPIRED', error: message };
  }
  if (
    /insufficient funds/i.test(message) ||
    /insufficient funds/i.test(details ?? '')
  ) {
    return { status: 'INSUFFICIENT_FUNDS', error: message };
  }
  if (
    /transaction underpriced|fee too low|max fee per gas less than block base fee|intrinsic gas too low/i.test(
      message,
    )
  ) {
    return { status: 'GAS_PRICE_TOO_LOW', error: message };
  }
  return { status: 'FAILED_TO_SEND_TRANSACTION', error: message };
}

function isReceiptNotFound(error: Error): boolean {
  return (
    error.name === 'TransactionReceiptNotFoundError' ||
    /could not be found|receipt.*not.*found/i.test(error.message)
  );
}

export function createEthTxPrimitives(
  clients: SignerClientBundle,
): EthTxPrimitives {
  const getSignerNonce = async (chainId: number): Promise<number> => {
    // ===================== DISTRIBUTED-LOCK SEAM (deferred) =================
    // TODO(NFI-xxxx): wrap nonce allocation in a cross-process critical
    // section. Today we rely on the MINT queue's
    // `maxConcurrentActivityTaskExecutions: 1` (workers/index.ts) to serialize
    // SENDS, but two CONCURRENT mint workflows can still READ the same
    // 'pending' nonce here and collide. Drop-in options (both keep this
    // function's public signature unchanged):
    //   (a) Postgres advisory lock + persisted counter, mirroring
    //       grantClaimAtomic (campaign-grant-claims.activities.ts):
    //         await $withTransaction(async (tx) => {
    //           await tx.execute(sql.raw(
    //             `SELECT pg_advisory_xact_lock(hashtext('signer:${chainId}'))`));
    //           // read max(onchain 'pending', persisted_counter + 1), persist, return
    //         }, { isolationLevel: 'serializable' });
    //   (b) Redis INCR on `signer-nonce:${chainId}` seeded from on-chain
    //       'pending' (lib/redis.ts client).
    // Keeping getSignerNonce a SEPARATE activity (not folded into send) is what
    // makes this a single-function change.
    // =======================================================================
    const publicClient = clients.getPublicClient(chainId);
    const walletClient = await clients.getWalletClient(chainId);
    return publicClient.getTransactionCount({
      address: walletClient.account.address,
      blockTag: 'pending',
    });
  };

  const sendPreparedTransaction = async (
    preparedTx: PreparedTxOnlySerializableParams,
    chainId: number,
    nonce: number,
    gasPriceMultiplier: number,
  ): Promise<TxSendOnlyResult> => {
    const ctx = Context.current();
    const walletClient = await clients.getWalletClient(chainId);
    const publicClient = clients.getPublicClient(chainId);

    const tx = {
      ...preparedTx,
      account: walletClient.account,
      nonce,
    } as PrepareTransactionRequestReturnType;

    const [gasLimitError, gasLimit] = await resolve(
      publicClient.estimateGas(tx),
    );
    if (gasLimitError) {
      const error = gasLimitError as EstimateGasErrorType;
      ctx.log.error(`Failed to estimate gas - error: ${error.message}`);
      return { status: 'UNPREDICTABLE_GAS_LIMIT', error: error.message };
    }
    tx.gas = gasLimit;

    const [gasPriceError, gasPrice] = await resolve(publicClient.getGasPrice());
    if (gasPriceError) {
      const error = gasPriceError as GetGasPriceErrorType;
      ctx.log.error(`Failed to get gas price - error: ${error.message}`);
      return { status: 'FAILED_TO_GET_GAS_PRICE', error: error.message };
    }
    const maxGasPriceMultiplier =
      await clients.resolveMaxGasPriceMultiplier(chainId);
    tx.maxFeePerGas = multiplyBigIntByFraction(
      gasPrice,
      Math.min(gasPriceMultiplier, maxGasPriceMultiplier),
    );

    const [sendError, txHash] = await resolve(
      walletClient.sendTransaction({ ...tx }),
    );
    if (sendError) {
      const error = sendError as SendTransactionErrorType;
      ctx.log.error(`Failed to send transaction - error: ${error.message}`);
      return classifySendError(error);
    }
    ctx.log.info(`Transaction sent - nonce: ${nonce}, hash: ${txHash}`);
    return { status: 'SENT', txHash };
  };

  const getTransactionConfirmation = async (
    txHashes: Hash[],
    chainId: number,
    pinnedNonce: number,
    confirmations: number,
  ): Promise<TxConfirmationResult> => {
    const ctx = Context.current();
    const publicClient = clients.getPublicClient(chainId);

    const currentBlock = await publicClient.getBlockNumber();

    const confirmed: Array<{ hash: Hash; blockNumber: bigint; confs: number }> =
      [];
    let revertedHash: { hash: Hash; blockNumber: bigint } | null = null;
    let anyReceiptFound = false;

    for (const hash of txHashes) {
      const [receiptError, receipt] = await resolve(
        publicClient.getTransactionReceipt({ hash }),
      );
      if (receiptError) {
        // Not mined yet is expected; only a genuine transport error should
        // bubble up so Temporal's activity retry policy can handle it.
        if (isReceiptNotFound(receiptError)) {
          continue;
        }
        throw receiptError;
      }
      anyReceiptFound = true;
      if (receipt.status === 'success') {
        const confs = Number(currentBlock - receipt.blockNumber) + 1;
        if (confs >= confirmations) {
          confirmed.push({ hash, blockNumber: receipt.blockNumber, confs });
        }
      } else if (!revertedHash) {
        revertedHash = { hash, blockNumber: receipt.blockNumber };
      }
    }

    if (confirmed.length > 1) {
      return {
        kind: 'MULTIPLE_CONFIRMED',
        winners: confirmed.map((c) => c.hash),
      };
    }
    if (confirmed.length === 1) {
      const { hash, blockNumber, confs } = confirmed[0];
      return {
        kind: 'CONFIRMED',
        winner: hash,
        blockNumber: blockNumber.toString(),
        confirmations: confs,
      };
    }
    if (revertedHash) {
      return {
        kind: 'REVERTED',
        reverted: revertedHash.hash,
        blockNumber: revertedHash.blockNumber.toString(),
      };
    }

    // None of our candidates mined (deeply enough). Detect a consumed nonce so
    // the workflow can distinguish "still pending" from "someone else took our
    // nonce". Failures to read are treated as PENDING (keep waiting).
    if (!anyReceiptFound) {
      const [addrError, address] = await resolve(
        clients.getWalletClient(chainId).then((w) => w.account.address),
      );
      if (!addrError) {
        const [nonceError, onChainNonce] = await resolve(
          publicClient.getTransactionCount({ address, blockTag: 'latest' }),
        );
        if (!nonceError && onChainNonce > pinnedNonce) {
          return { kind: 'NONCE_FILLED_NO_CANDIDATE', onChainNonce };
        }
      }
    }

    return { kind: 'PENDING' };
  };

  return {
    getSignerNonce,
    sendPreparedTransaction,
    getTransactionConfirmation,
  };
}
