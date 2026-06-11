/**
 * Mint / charge concurrency stress test (test workflow).
 *
 * Fans out many child workflows PER ACCOUNT, all at once, with deliberately
 * colliding parameters to exercise the double-mint / idempotency machinery
 * (pinned-nonce race + the pre-re-pin "already sent" gate). Per account it fires
 * concurrently:
 *   - N × mintNfsc at the SAME amount               (identical calldata)
 *   - N × mintNamefiNFT with DISTINCT names         (varied, non-colliding)
 *   - N × chargeNfsc, same amount + SAME reason      (same idempotency key)
 *   - N × chargeNfsc, same amount + DIFFERENT reasons (distinct charges)
 *
 * Temporal allows only ONE running execution per workflowId, so to fire these
 * "at the same time" each child gets a UNIQUE (runId-derived) id; the colliding
 * input lives in the ARGS (same amount / same `reason`). `ALLOW_DUPLICATE` reuse
 * lets the stress test be re-run freely. Children run WITHOUT a
 * `workflowExecutionTimeout` by default (set `childTimeout` to bound them) so a
 * slow/gated child runs to completion instead of being force-failed mid-send.
 *
 * It also reads the mint signer's on-chain transaction count (nonce) BEFORE and
 * AFTER the fan-out: the delta is how many txs the signer actually landed, which
 * must NOT exceed the number of children fired (one nonce per child) — a larger
 * delta means a single child double-sent (the bug this exercises). It otherwise
 * asserts nothing, returning a per-child result (txHash or error) for inspection.
 *
 * TESTNET ONLY — these submit REAL transactions via the mint/x402 signers.
 */

import { CHAINS, namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import type { Duration } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../../shared/enums';
import { typedProxyActivities } from '../../shared/workflow-helpers/typed-proxy-activities';
import { chargeNfscWorkflow, mintNamefiNFT, mintNfsc } from '../mint.workflow';

type Hex = `0x${string}`;

export interface MintStressTestInput {
  /** Testnet chain id (default: Sepolia 11155111). */
  chainId?: number;
  /** Target EOAs (default: the four provided stress accounts). */
  accounts?: Hex[];
  /** USD amount reused across every mint/charge (default: 0.1). */
  amountInUsd?: number;
  /** Identical-amount NFSC mints per account (default: 3). */
  nfscMintsPerAccount?: number;
  /** Distinct-name NFT mints per account (default: 3). */
  nftMintsPerAccount?: number;
  /** Same-idempotency-key charges per account (default: 3). */
  sameKeyChargesPerAccount?: number;
  /** Distinct-idempotency-key charges per account (default: 3). */
  diffKeyChargesPerAccount?: number;
  /** Optional per-child execution timeout. Omitted by default (no timeout) so a slow/gated child runs to completion instead of being force-failed mid-send. */
  childTimeout?: Duration;
}

export interface StressChildResult {
  label: string;
  account: Hex;
  workflowId: string;
  status: 'ok' | 'error';
  txHash?: string;
  error?: string;
}

export interface MintStressTestOutput {
  chainId: number;
  total: number;
  ok: number;
  errors: number;
  /**
   * Mint signer's on-chain tx count (nonce) read before/after the fan-out.
   * `delta` is how many txs the signer actually landed; it must be `<= total`
   * (one nonce per child). `possibleDoubleSend` flags `delta > total` — a single
   * child sent more than one landed tx (the double-send this test hunts for).
   */
  signerNonce: { before: number; after: number; delta: number };
  possibleDoubleSend: boolean;
  results: StressChildResult[];
}

const DEFAULT_ACCOUNTS: Hex[] = [
  '0xB5856d4598c919834913b8656ebc15a64d3C7836',
  '0x1F73c7Cf6Dc1dDCC355f8a0e44024cf32C62fA89',
  '0x3De960389439BFf54a0624dD595691727bF4FD05',
  '0x0CF89AA16f304d13217d1AA1256A6174fEeBE7bf',
];

export async function mintStressTestWorkflow(
  input: MintStressTestInput = {},
): Promise<MintStressTestOutput> {
  const {
    chainId = CHAINS.sepolia.id,
    accounts = DEFAULT_ACCOUNTS,
    amountInUsd = 0.1,
    nfscMintsPerAccount = 3,
    nftMintsPerAccount = 3,
    sameKeyChargesPerAccount = 3,
    diffKeyChargesPerAccount = 3,
    childTimeout,
  } = input;

  // Read the MINT signer's on-chain tx count (nonce) to bound how many txs the
  // fan-out actually lands — one per child at most; more ⇒ a child double-sent.
  const { getPendingSignerNonce } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.MINT,
    options: {
      startToCloseTimeout: '30 seconds',
      retry: { maximumAttempts: 3 },
      summary: 'read mint signer nonce',
    },
  });

  const { runId } = workflow.workflowInfo();
  // Date.now() is deterministic inside the Temporal workflow sandbox.
  const expirationTimeInSeconds =
    Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  const pending: Promise<StressChildResult>[] = [];

  /** Common child options — unique id, ALLOW_DUPLICATE, single attempt; timeout only if `childTimeout` is set. */
  const childOpts = (workflowId: string) => ({
    workflowId,
    taskQueue: TEMPORAL_QUEUES.MINT,
    workflowIdReusePolicy: 'ALLOW_DUPLICATE' as const,
    ...(childTimeout ? { workflowExecutionTimeout: childTimeout } : {}),
    retry: { maximumAttempts: 1 },
  });

  /** Wrap a child promise into a per-child result (never rejects the run). */
  const collect = (
    label: string,
    account: Hex,
    workflowId: string,
    started: Promise<string>,
  ): void => {
    pending.push(
      started.then(
        (txHash): StressChildResult => ({
          label,
          account,
          workflowId,
          status: 'ok',
          txHash,
        }),
        (error): StressChildResult => ({
          label,
          account,
          workflowId,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        }),
      ),
    );
  };

  const nonceBefore = await getPendingSignerNonce(chainId);

  for (const account of accounts) {
    const shortAccount = account.slice(2, 8).toLowerCase();

    // 1) Identical-amount NFSC mints — exposes any cross-workflow double-mint.
    for (let i = 0; i < nfscMintsPerAccount; i++) {
      const workflowId = `stress-${runId}-mintnfsc-${account}-${i}`;
      collect(
        'mintNfsc:same-amount',
        account,
        workflowId,
        workflow.executeChild(mintNfsc, {
          args: [{ chainId, account, amountInUsd }],
          ...childOpts(workflowId),
        }),
      );
    }

    // 2) Distinct-name NFT mints (names are runId-derived → non-colliding).
    for (let i = 0; i < nftMintsPerAccount; i++) {
      const workflowId = `stress-${runId}-mintnft-${account}-${i}`;
      // Validate-and-brand instead of asserting: runId/shortAccount are lowercase
      // hex so this is always a valid normalized domain, but parsing makes that a
      // checked invariant (and fails loudly if the format ever drifts) rather than
      // shipping an unchecked string into the child mint.
      const normalizedDomainName = namefiNormalizedDomainSchema.parse(
        `stress-${runId.slice(0, 8)}-${shortAccount}-${i}.nfi`,
      );
      collect(
        'mintNamefiNFT:distinct-name',
        account,
        workflowId,
        workflow.executeChild(mintNamefiNFT, {
          args: [
            {
              chainId,
              toAddress: account,
              normalizedDomainName,
              expirationTimeInSeconds,
            },
          ],
          ...childOpts(workflowId),
        }),
      );
    }

    // 3) Charges with the SAME amount + SAME reason (same idempotency key).
    const sameReason = `stress-${runId}-charge-${account}`;
    for (let i = 0; i < sameKeyChargesPerAccount; i++) {
      const workflowId = `stress-${runId}-charge-samekey-${account}-${i}`;
      collect(
        'chargeNfsc:same-key',
        account,
        workflowId,
        workflow.executeChild(chargeNfscWorkflow, {
          args: [chainId, account, amountInUsd, sameReason, '0x'],
          ...childOpts(workflowId),
        }),
      );
    }

    // 4) Charges with the SAME amount + DIFFERENT reasons (distinct charges).
    for (let i = 0; i < diffKeyChargesPerAccount; i++) {
      const workflowId = `stress-${runId}-charge-diffkey-${account}-${i}`;
      const reason = `stress-${runId}-charge-${account}-${i}`;
      collect(
        'chargeNfsc:diff-key',
        account,
        workflowId,
        workflow.executeChild(chargeNfscWorkflow, {
          args: [chainId, account, amountInUsd, reason, '0x'],
          ...childOpts(workflowId),
        }),
      );
    }
  }

  const results = await Promise.all(pending);
  // All children have confirmed (sendAndConfirm waits for receipts), so the
  // 'pending' nonce now reflects every tx the signer landed.
  const nonceAfter = await getPendingSignerNonce(chainId);
  const nonceDelta = nonceAfter - nonceBefore;
  const possibleDoubleSend = nonceDelta > results.length;

  const ok = results.filter((r) => r.status === 'ok').length;
  workflow.log.info(
    `[mint-stress-test] chain ${chainId}: fired ${results.length} children (${ok} ok, ${results.length - ok} error); signer nonce ${nonceBefore}→${nonceAfter} (Δ${nonceDelta})${possibleDoubleSend ? ' — POSSIBLE DOUBLE-SEND (Δ > children)' : ''}`,
  );

  return {
    chainId,
    total: results.length,
    ok,
    errors: results.length - ok,
    signerNonce: { before: nonceBefore, after: nonceAfter, delta: nonceDelta },
    possibleDoubleSend,
    results,
  };
}
