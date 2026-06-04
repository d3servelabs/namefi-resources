import * as workflow from '@temporalio/workflow';

/**
 * Options for {@link runWithTestHarness}.
 */
export interface TestHarnessOptions {
  /**
   * Master switch. When `false` (or omitted-as-false by the caller) the harness
   * is a total passthrough — no signal handler, no scope, no extra commands — so
   * production runs are replay-identical to not wrapping at all. Callers on a
   * code path that runs in production MUST gate this to a non-production value
   * (see `isNonProductionEnvironment`).
   */
  enabled?: boolean;
  /**
   * The signal an operator sends to force this action to fail. Must be distinct
   * per wrap-site in a single workflow execution (e.g.
   * `test-harness:enable-dnssec:ds-association`). Defaults to `testHarnessFail`.
   */
  signalName?: string;
  /**
   * Optional delay (ms) to sleep before invoking the action. The sleep runs
   * inside the harness scope, so a fail-signal arriving during it cancels the
   * sleep and fails immediately. Useful to widen the window for sending the
   * signal, or to simulate a slow action.
   */
  delayMs?: number;
}

/**
 * Wraps an action so an operator can intentionally fail it via a signal — a
 * testing aid for exercising decision gates (`runWithDecisionGate`) without
 * waiting for a real poll deadline or registrar failure.
 *
 * Structurally this is a signal-driven cancellation scope, mirroring the
 * timer-driven `runAction` inside {@link runWithDecisionGate}: it races the
 * action against a `workflow.condition` fed by the fail-signal. When the signal
 * arrives it cancels the in-flight work and throws a non-retryable
 * `ApplicationFailure` (`type: 'test-harness/forced-failure'`). Because that is
 * an ordinary throw — not a cancellation — a surrounding `runWithDecisionGate`
 * treats it like any action failure and opens the gate.
 *
 * A cancellation the harness did NOT trigger (the whole workflow, or an outer
 * scope such as `runWithDecisionGate`'s `actionTimeoutMs`, being cancelled) is
 * re-thrown so it keeps propagating — `failTriggered` is set only when this
 * harness's own signal fired.
 *
 * Replay-safe: no `process.env` / `Date.now` / `Math.random`. The non-production
 * gate is the caller's responsibility (pass `enabled` from an activity-resolved
 * environment), never read here.
 */
export async function runWithTestHarness<T>(
  action: () => Promise<T>,
  options?: TestHarnessOptions,
): Promise<T> {
  if (!options?.enabled) return action();

  const signalName = options.signalName ?? 'testHarnessFail';
  const idSuffix = ` [${signalName}]`;

  // Arm the handler synchronously (before any await) so a signal buffered just
  // before the wait is still honored.
  const failSignal = workflow.defineSignal(signalName);
  let failRequested = false;
  workflow.setHandler(failSignal, () => {
    failRequested = true;
  });

  let failTriggered = false;
  const scope = new workflow.CancellationScope({ cancellable: true });
  try {
    return await scope.run(async () => {
      void workflow
        .condition(() => failRequested)
        .then(() => {
          failTriggered = true;
          scope.cancel();
        })
        .catch(() => {
          // Condition cancelled because the action settled first — nothing to do.
        });
      if (options.delayMs !== undefined) {
        await workflow.sleep(options.delayMs, {
          summary: `delay:${signalName}`,
        });
      }
      return action();
    });
  } catch (error) {
    if (failTriggered && workflow.isCancellation(error)) {
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        type: 'test-harness/forced-failure',
        message: `Test harness forced a failure via signal${idSuffix}`,
      });
    }
    throw error;
  } finally {
    workflow.setHandler(failSignal, undefined);
  }
}
