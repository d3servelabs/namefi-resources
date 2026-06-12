import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../../shared';
import { catchAndAlertLocally } from './catch-and-alert-locally';
import { typedProxyActivities } from './typed-proxy-activities';

/**
 * Poll cadence + cap for the post-success optimistic-row cleanup. After a deferred
 * NFT op confirms, the row should be removed as soon as the change is reflected in
 * the index (so "Minting…" / "Updating expiration…" stops showing), not after a
 * flat multi-day wait. We poll until then; the cap bounds the wait if the indexer
 * is slow or down — the insert-time 2-day TTL + scheduled sweep remain the ultimate
 * backstop for ops that never get indexed.
 */
const POLL_INTERVAL = '2 minutes';
const MAX_POLL_ATTEMPTS = 60; // ~2 hours

/**
 * Wait until a confirmed in-flight NFT tx row is reflected in the index (resolved
 * / superseded), then delete it. Replaces the old flat 2-day per-op sleep so a
 * successful op's optimistic overlay is cleaned up shortly after it lands instead
 * of lingering for days. Best-effort throughout: a failed check just retries on the
 * next tick, and the final delete is alert-wrapped. Must run inside a Temporal
 * workflow (uses `workflow.sleep`).
 */
export async function awaitInFlightNftTxIndexedThenDelete({
  id,
  normalizedDomainName,
}: {
  id: string;
  normalizedDomainName: NamefiNormalizedDomain;
}): Promise<void> {
  const { isInFlightNftTxRowResolved, deleteInFlightNftTxRow } =
    typedProxyActivities({
      temporalEnum: TEMPORAL_ENUMS.INDEXERS,
      options: { ...shortRunningOpts },
    });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const checked = await catchAndAlertLocally(
      () => isInFlightNftTxRowResolved({ id }),
      {
        message: 'Failed to check whether in-flight NFT tx row is indexed',
        details: { id, normalizedDomainName },
      },
    );
    if (checked?.resolved) {
      break;
    }
    await workflow.sleep(POLL_INTERVAL);
  }

  await catchAndAlertLocally(() => deleteInFlightNftTxRow({ id }), {
    message: 'Failed to delete in-flight NFT tx row after poll-until-indexed',
    details: { id, normalizedDomainName },
  });
}
