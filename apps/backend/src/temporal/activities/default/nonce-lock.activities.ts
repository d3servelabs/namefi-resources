/**
 * Distributed signer-nonce lock — DEFAULT-queue activities.
 *
 * The orchestrator (`staggeredSendRace`) acquires this lock BEFORE pinning the
 * signer nonce and holds it across the whole race (all re-pins) via a heartbeat,
 * so only one workflow at a time can read→send for a given `(chainId, signer)`.
 * Correctness still rests on the pinned nonce; the lock removes the cross-
 * workflow collision window. See `#lib/redlock` and the plan.
 */

import { Context } from '@temporalio/activity';
import { ApplicationFailure } from '@temporalio/common';
import { LockAcquisitionError } from 'redlock-universal';
import { getViemWalletClient } from '#lib/crypto/viem-clients';
import { getX402WalletClient } from '#lib/crypto/x402-viem-clients';
import {
  type LockHandle,
  buildSignerNonceLockKey,
  createNonceLock,
} from '#lib/redlock';
import type { SignerKind } from './nonce-collision.activities';

/**
 * Serializable token the workflow holds and passes to extend/release.
 * `absoluteDeadlineMs` is the hard ceiling on total lock lifetime.
 */
export interface NonceLockToken {
  handle: LockHandle;
  absoluteDeadlineMs: number;
}

async function resolveSignerAddress(
  signerKind: SignerKind,
  chainId: number,
): Promise<`0x${string}`> {
  const walletClient =
    signerKind === 'x402'
      ? await getX402WalletClient(chainId)
      : await getViemWalletClient(chainId);
  return walletClient.account.address;
}

export async function acquireNonceLock(input: {
  chainId: number;
  signerKind: SignerKind;
  ttlMs: number;
  absoluteMaxMs: number;
}): Promise<NonceLockToken> {
  const { chainId, signerKind, ttlMs, absoluteMaxMs } = input;
  const ctx = Context.current();
  const address = await resolveSignerAddress(signerKind, chainId);
  const key = buildSignerNonceLockKey(chainId, address);

  try {
    // Build the lock INSIDE the try so a redis-connection failure in
    // `createNonceLock` (via getRedisClient) is caught + classified here rather
    // than thrown raw.
    const lock = await createNonceLock({ key, ttlMs });
    const handle = await lock.acquire();
    const absoluteDeadlineMs = Date.now() + absoluteMaxMs;
    ctx.log.info(
      `[nonce-lock] acquired ${key} (ttl ${ttlMs}ms, absMax ${absoluteMaxMs}ms)`,
    );
    return { handle, absoluteDeadlineMs };
  } catch (error) {
    if (error instanceof LockAcquisitionError) {
      // Contended — throw RETRYABLE so Temporal backs off and re-attempts until
      // the holder releases (or its short TTL auto-expires on crash).
      throw ApplicationFailure.create({
        message: `[nonce-lock] contended ${key}`,
        type: 'nonce-lock/contended',
      });
    }
    // Redis/infra error (e.g. connection refused). Re-throw RETRYABLE (a raw
    // Error is retryable by default) so the workflow WAITS for redis to recover
    // rather than failing the mint — preserving serialization. The
    // getRedisClient cache no longer poisons on failure, so this self-heals.
    ctx.log.warn(
      `[nonce-lock] acquire error for ${key}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
}

export async function extendNonceLock(input: {
  token: NonceLockToken;
  ttlMs: number;
}): Promise<boolean> {
  const { token, ttlMs } = input;
  // Absolute-TTL backstop: never hold the lock past its absolute deadline, so a
  // runaway/buggy heartbeat can't keep the signer locked indefinitely. NOTE: the
  // deadline is stamped from the ACQUIRING worker's clock and checked here on the
  // (possibly different) EXTENDING worker's clock — best-effort under clock skew.
  // The authoritative bound on extend count is the workflow-side `elapsed` cap in
  // `runNonceLockHeartbeat`; this Date.now() check is belt-and-suspenders.
  if (Date.now() >= token.absoluteDeadlineMs) {
    Context.current().log.warn(
      `[nonce-lock] absolute cap reached for ${token.handle.key}; not extending`,
    );
    return false;
  }
  const lock = await createNonceLock({ key: token.handle.key, ttlMs });
  return lock.extend(token.handle, ttlMs);
}

export async function releaseNonceLock(input: {
  token: NonceLockToken;
}): Promise<void> {
  const { token } = input;
  try {
    const lock = await createNonceLock({
      key: token.handle.key,
      ttlMs: token.handle.ttl,
    });
    await lock.release(token.handle);
  } catch (error) {
    // Best-effort: the short rolling TTL expires the lock regardless.
    Context.current().log.warn(
      `[nonce-lock] release failed for ${token.handle.key}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
