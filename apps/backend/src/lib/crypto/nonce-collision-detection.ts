/**
 * Nonce collision detection — was a transaction with this nonce already sent?
 *
 * Defense-in-depth for the single-signer retry flow: before bumping gas and
 * re-broadcasting at a pinned nonce, confirm the nonce has not ALREADY been
 * consumed on-chain — either by a transaction carrying our exact calldata (it
 * was *our* send, lost to a transport error → do not resend) or by a DIFFERENT
 * transaction (a real collision that needs admin intervention).
 *
 * Read-only and **viem-only**: uses `getTransactionCount`, `getBlockNumber`,
 * `getBlock`, and `getTransactionReceipt` — no provider-specific (e.g. Alchemy)
 * enhanced APIs, so it works against any RPC. The transaction that consumed the
 * nonce is located by a bounded block scan starting at a caller-supplied
 * `fromBlock` (the chain height at send time); inject `findConsumingTx` to plug
 * in a faster source (an indexer) where available.
 *
 * See `prd-nonce-collision-detection.md`.
 */

import {
  type Abi,
  type Address,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type Hash,
  type Hex,
  type PublicClient,
  type TransactionReceipt,
  encodeFunctionData,
} from 'viem';

/** A located transaction that consumed the queried nonce. */
export interface ConsumingTx {
  hash: Hash;
  to: Address | null;
  input: Hex;
  nonce: number;
}

export type NonceCheckResult =
  /**
   * Nonce not yet CONFIRMED on-chain (read at `blockTag: 'latest'`). Safe to
   * (re)broadcast AT THE SAME nonce (pinned replacement). This does NOT prove
   * the absence of an in-flight (mempool) transaction, so do not use it to
   * justify sending on a fresh or bumped nonce.
   */
  | { status: 'unused' }
  /**
   * Our exact calldata already landed at this nonce — do NOT resend. `receipt`
   * lets the caller tell a successful send from a reverted one; it is `null`
   * only when the receipt fetch itself failed — the do-not-resend verdict still
   * stands. The verdict is taken from a 1-confirmation `'latest'` view; for
   * finality, gate on `receipt.blockNumber` vs the current head.
   */
  | { status: 'matched'; txHash: Hash; receipt: TransactionReceipt | null }
  /** A DIFFERENT transaction took the nonce — halt and escalate to an admin. */
  | { status: 'conflict'; txHash: Hash; to: Address | null; onChainData: Hex }
  /**
   * Nonce is consumed but the consuming tx could not be located within the
   * scanned range (mined before `fromBlock`, or the scan cap was hit). Treat
   * like `conflict`: escalate, do NOT resend. `nonce` echoes the queried nonce;
   * `onChainNonce` is the signer's current confirmed transaction count.
   */
  | { status: 'consumed_unidentified'; nonce: number; onChainNonce: number };

/** Default block-scan window when `fromBlock` is not supplied. */
export const DEFAULT_LOOKBACK_BLOCKS = 256n;
/** Hard cap on the number of blocks the default scanner inspects. */
export const DEFAULT_MAX_BLOCKS_SCANNED = 512;

export interface FindConsumingTxArgs {
  signer: Address;
  nonce: number;
  /** Start scanning at this block (the chain height at send time). */
  fromBlock?: bigint;
  lookbackBlocks?: bigint;
  maxBlocksScanned?: number;
}

export interface NonceCollisionOptions {
  /**
   * Strategy that locates the transaction which consumed `nonce` for `signer`.
   * Defaults to {@link scanBlocksForSignerNonce} (a viem block scan). Inject a
   * faster source (an indexer) where one is available.
   */
  findConsumingTx?: (
    client: PublicClient,
    args: FindConsumingTxArgs,
  ) => Promise<ConsumingTx | null>;
  lookbackBlocks?: bigint;
  maxBlocksScanned?: number;
}

export interface CheckNonceConsumedParams {
  signer: Address;
  nonce: number;
  /** The calldata we intended to send (decides *our send* vs a collision). */
  expectedData: Hex;
  /** The `to` we intended to call. */
  contractAddress: Address;
  /** Start block for the scan (chain height at send time). */
  fromBlock?: bigint;
}

/**
 * Locate the signer's transaction at `nonce` by scanning blocks ascending from
 * `fromBlock` (default: the last {@link DEFAULT_LOOKBACK_BLOCKS}). Stops early
 * once a signer transaction with a HIGHER nonce is seen — a sender's nonces are
 * monotonic, so the target must have been mined before the scan window.
 *
 * viem-only: `getBlockNumber` + `getBlock({ includeTransactions: true })`.
 */
export async function scanBlocksForSignerNonce(
  client: PublicClient,
  args: FindConsumingTxArgs,
): Promise<ConsumingTx | null> {
  const { signer, nonce } = args;
  const signerLower = signer.toLowerCase();
  const latest = await client.getBlockNumber();
  const lookback = args.lookbackBlocks ?? DEFAULT_LOOKBACK_BLOCKS;
  const maxBlocks = args.maxBlocksScanned ?? DEFAULT_MAX_BLOCKS_SCANNED;

  // With a send-time `fromBlock`, scan ascending from it. Without one, anchor the
  // window at the RECENT end (where a just-consumed nonce sits) and bound it by
  // BOTH `lookback` and the hard cap, so the scan always reaches `latest` rather
  // than stranding the cap on stale blocks.
  let start: bigint;
  if (args.fromBlock !== undefined) {
    start = args.fromBlock;
  } else {
    const cap = BigInt(maxBlocks) - 1n;
    const window = lookback < cap ? lookback : cap;
    start = latest > window ? latest - window : 0n;
  }

  let scanned = 0;
  for (let block = start; block <= latest; block += 1n) {
    if (scanned >= maxBlocks) break;
    scanned += 1;

    const { transactions } = await client.getBlock({
      blockNumber: block,
      includeTransactions: true,
    });
    for (const tx of transactions) {
      if (tx.from.toLowerCase() !== signerLower) continue;
      if (tx.nonce === nonce) {
        return { hash: tx.hash, to: tx.to, input: tx.input, nonce: tx.nonce };
      }
      // Same signer, higher nonce → we've scanned past the target; it was mined
      // before `start`. No point scanning further.
      if (tx.nonce > nonce) return null;
    }
  }
  return null;
}

/** Fetch a receipt, tolerating a transient RPC failure (returns `null`). */
async function getReceiptOrNull(
  client: PublicClient,
  hash: Hash,
): Promise<TransactionReceipt | null> {
  try {
    return await client.getTransactionReceipt({ hash });
  } catch {
    return null;
  }
}

/**
 * Has `nonce` already been consumed on-chain by `signer`, and if so, was it our
 * intended call (`expectedData` to `contractAddress`) or a collision?
 *
 * The nonce is considered consumed when it is below the signer's `'latest'`
 * (confirmed) transaction count. NOTE: this is a 1-confirmation view — see the
 * `matched` doc on `NonceCheckResult` for the finality caveat. Treat a
 * `consumed_unidentified` result like `conflict` (escalate, never resend), and
 * switch exhaustively over the returned union.
 */
export async function checkNonceConsumed(
  client: PublicClient,
  params: CheckNonceConsumedParams,
  options: NonceCollisionOptions = {},
): Promise<NonceCheckResult> {
  const { signer, nonce, expectedData, contractAddress, fromBlock } = params;

  const confirmedCount = await client.getTransactionCount({
    address: signer,
    blockTag: 'latest',
  });
  // Nonces are 0-indexed, so this COUNT is also the NEXT (unused) nonce: a count
  // of N means nonces 0..N-1 are confirmed and N is still free. A nonce is
  // therefore consumed only when STRICTLY below the count; `nonce ===
  // confirmedCount` is exactly that next-free slot, so it is still 'unused'.
  if (nonce >= confirmedCount) {
    return { status: 'unused' };
  }

  const findConsumingTx = options.findConsumingTx ?? scanBlocksForSignerNonce;
  const tx = await findConsumingTx(client, {
    signer,
    nonce,
    fromBlock,
    lookbackBlocks: options.lookbackBlocks,
    maxBlocksScanned: options.maxBlocksScanned,
  });
  if (!tx) {
    return {
      status: 'consumed_unidentified',
      nonce,
      onChainNonce: confirmedCount,
    };
  }

  const sameTo = (tx.to ?? '').toLowerCase() === contractAddress.toLowerCase();
  const sameData = tx.input.toLowerCase() === expectedData.toLowerCase();
  if (sameTo && sameData) {
    // The do-not-resend verdict is already proven by (sameTo && sameData); the
    // receipt is reconciliation-only (success vs revert), so a transient
    // receipt-RPC failure must not turn a proven 'matched' into a thrown error.
    const receipt = await getReceiptOrNull(client, tx.hash);
    return { status: 'matched', txHash: tx.hash, receipt };
  }

  return {
    status: 'conflict',
    txHash: tx.hash,
    to: tx.to,
    onChainData: tx.input,
  };
}

export interface CheckCallNotSentParams<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
> {
  signer: Address;
  nonce: number;
  contractAddress: Address;
  abi: TAbi;
  functionName: TFunctionName;
  args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName>;
  fromBlock?: bigint;
}

/**
 * Ergonomic wrapper over {@link checkNonceConsumed}: encodes `(abi,
 * functionName, args)` into calldata with viem's `encodeFunctionData` — a
 * deterministic, normalized encoding, so byte-equality against the on-chain
 * input is a valid identity check — then delegates.
 *
 * Caveat: pass canonically-typed args. `encodeFunctionData` normalizes address
 * casing, but a value representable two ways upstream (e.g. a BigInt amount vs a
 * decimal string) must be normalized by the caller before encoding.
 */
export async function checkCallNotSent<
  const TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(
  client: PublicClient,
  params: CheckCallNotSentParams<TAbi, TFunctionName>,
  options: NonceCollisionOptions = {},
): Promise<NonceCheckResult> {
  const { signer, nonce, contractAddress, abi, functionName, args, fromBlock } =
    params;

  const expectedData = encodeFunctionData({
    abi,
    functionName,
    args,
  } as Parameters<typeof encodeFunctionData>[0]);

  return checkNonceConsumed(
    client,
    { signer, nonce, expectedData, contractAddress, fromBlock },
    options,
  );
}
