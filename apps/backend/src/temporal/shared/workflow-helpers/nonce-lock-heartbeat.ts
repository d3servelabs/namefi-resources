/**
 * Distributed signer-nonce lock heartbeat (workflow-safe).
 *
 * Runs alongside `staggeredSendRace`: periodically extends the rolling lock TTL
 * so an alive holder keeps the lock, stopping when the race finishes (`isDone`),
 * the lock is lost, or the absolute cap is reached. Isolated for unit testing and
 * so the race tests can mock it.
 */

import * as workflow from '@temporalio/workflow';
import type { NonceLockToken } from '../../activities/default/nonce-lock.activities';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { interruptibleSleep } from './interruptible-sleep';
import { typedProxyActivities } from './typed-proxy-activities';

export async function runNonceLockHeartbeat(params: {
  token: NonceLockToken;
  /** Short rolling redis TTL set on each extend. */
  lockTtlMs: number;
  /** Cadence between extends (< lockTtlMs). */
  intervalMs: number;
  /** Workflow-side cap mirroring the token's absolute deadline. */
  absoluteMaxMs: number;
  isDone: () => boolean;
  label: string;
}): Promise<void> {
  const { token, lockTtlMs, intervalMs, absoluteMaxMs, isDone, label } = params;

  const { extendNonceLock } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '15 seconds',
      retry: {
        initialInterval: '1 second',
        maximumInterval: '10 seconds',
        backoffCoefficient: 2,
        maximumAttempts: 10,
      },
      summary: `nonce-lock heartbeat (${label})`,
    },
  });
  const { generalAlertNamefi } = typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: { ...shortRunningOpts },
  });

  // Fire ONE escalation alert, only on a TERMINAL exit (lock genuinely lost /
  // likely lapsed / cap reached). Deliberately NOT per beat: a brief Redis
  // incident makes every extend fail, and alerting per beat would fan out one
  // alert per interval per active workflow. Best-effort — never let alerting
  // break the heartbeat (the pinned nonce remains the safety net).
  const escalate = async (reason: string): Promise<void> => {
    workflow.log.error(
      `[${label}] ${reason}; continuing under pinned-nonce safety`,
    );
    try {
      const info = workflow.workflowInfo();
      await generalAlertNamefi({
        title: `[${label}] nonce-lock heartbeat`,
        message: reason,
        extraData: {
          workflowId: info.workflowId,
          runId: info.runId,
          lockTtlMs,
        },
      });
    } catch {
      // best-effort: swallow alert failures so the heartbeat still returns cleanly
    }
  };

  let elapsed = 0;
  let lastGoodElapsed = 0;
  while (!isDone() && elapsed < absoluteMaxMs) {
    await interruptibleSleep(intervalMs, isDone, {
      summary: `nonce-lock heartbeat wait (${label})`,
    });
    if (isDone()) return;
    elapsed += intervalMs;

    // Extend directly (no per-beat alert): a TRANSIENT failure (the activity threw
    // after its retries ⇒ `undefined` here) is tolerated by the rolling TTL, so we
    // keep beating and escalate only if it persists. `false` = the lock is gone.
    let held: boolean | undefined;
    try {
      held = await extendNonceLock({ token, ttlMs: lockTtlMs });
    } catch (err) {
      workflow.log.debug(
        `[${label}] nonce-lock extend failed (transient): ${String(err)}`,
      );
      held = undefined;
    }

    if (held === true) {
      lastGoodElapsed = elapsed;
      continue;
    }
    if (held === false) {
      // DEFINITIVE: the lock value no longer matches (lost to another holder) or
      // the activity hit the absolute deadline. Stop for good.
      await escalate('nonce lock lost or capped');
      return;
    }
    // held === undefined (transient): the rolling TTL (lockTtlMs >> intervalMs)
    // tolerates a few missed beats, so KEEP TRYING unless extends have been failing
    // long enough that the lock may actually have lapsed.
    if (elapsed - lastGoodElapsed >= lockTtlMs - intervalMs) {
      await escalate(
        `nonce-lock extend failing ~${lockTtlMs}ms; lock may have lapsed`,
      );
      return;
    }
  }
  if (!isDone()) {
    await escalate('nonce-lock absolute cap reached; heartbeat stopped');
  }
}
