import type { Duration } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';

/**
 * A `workflow.sleep` that can be cut short early.
 *
 * Resolves when EITHER the duration elapses OR `until()` becomes true — whichever
 * comes first. This is the `Promise.race([sleep, condition])` pattern that recurs
 * across our workflows (staggered sends, escalating polls), extracted so the
 * timer can carry a `summary` that labels it in the Temporal UI.
 *
 * Determinism: both `workflow.sleep` and `workflow.condition` are replay-safe; the
 * `until()` predicate must read only deterministic workflow state.
 *
 * @param ms      sleep duration (ms number or ms-formatted string)
 * @param until   interrupt predicate — return true to end the sleep immediately
 * @param options optional `summary` shown on the timer in the Temporal UI
 */
export async function interruptibleSleep(
  ms: Duration,
  until: () => boolean,
  options?: { summary?: string },
): Promise<void> {
  // Already interrupted — skip the timer command entirely.
  if (until()) return;
  await Promise.race([
    workflow.sleep(
      ms,
      options?.summary ? { summary: options.summary } : undefined,
    ),
    workflow.condition(until),
  ]);
}
