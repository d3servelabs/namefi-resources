import * as workflow from '@temporalio/workflow';
import {
  type Actor,
  createDecisionGateRegistry,
  type GateAction,
  type GateOutcome,
  runWithDecisionGate,
} from '../../shared/workflow-helpers/decision-gate';
import {
  escalatingPoll,
  type PollPhase,
  PollInterrupted,
} from '../../shared/workflow-helpers/escalating-poller';
import { runWithTestHarness } from '../../shared/workflow-helpers/test-harness';

/**
 * Test-only harness workflows that exercise the decision-gate and
 * escalating-poller helpers inside a real Temporal workflow context. The
 * helpers are not workflows themselves, so the time-skipping test environment
 * needs these thin wrappers to register and drive them. Not registered with the
 * production worker — the tests bundle this file directly via `workflowsPath`.
 */

/** Signal used by {@link escalatingPollHarnessWorkflow} to test the interrupt hook. */
export const harnessInterruptSignal = workflow.defineSignal('harnessInterrupt');

/**
 * Exposes the resolved signal names of the registries a harness created, so the
 * tests can target each registry (including auto-prefixed ones) deterministically.
 */
export const harnessSignalNamesQuery =
  workflow.defineQuery<string[]>('harnessSignalNames');

export interface GateWaitHarnessInput {
  interactionId?: string;
  allowedActors?: Actor[];
  allowedActions?: GateAction[];
  timeoutMs?: number;
  /** When true, RESPOND payloads must be `{ ok: boolean }` or are rejected. */
  validateResponseShape?: boolean;
}

/** Arms a single gate and returns the resolved outcome (or TIMEOUT). */
export async function gateWaitHarnessWorkflow(
  input: GateWaitHarnessInput,
): Promise<GateOutcome<unknown>> {
  const registry = createDecisionGateRegistry();
  return registry.waitForDecision({
    interactionId: input.interactionId,
    allowedActors: input.allowedActors,
    allowedActions: input.allowedActions,
    timeoutMs: input.timeoutMs,
    validateResponse: input.validateResponseShape
      ? (raw) => {
          if (
            !raw ||
            typeof raw !== 'object' ||
            typeof (raw as { ok?: unknown }).ok !== 'boolean'
          ) {
            throw new Error('invalid response shape');
          }
          return raw;
        }
      : undefined,
  });
}

export interface RoutingHarnessInput {
  idA: string;
  idB: string;
  allowedActors?: Actor[];
}

/**
 * Single registry hosting two gates distinguished by `interactionId`. The
 * idiomatic way to have multiple wait-points in ONE workflow.
 */
export async function routingHarnessWorkflow(
  input: RoutingHarnessInput,
): Promise<{ a: GateOutcome<unknown>; b: GateOutcome<unknown> }> {
  const registry = createDecisionGateRegistry();
  const [a, b] = await Promise.all([
    registry.waitForDecision({
      interactionId: input.idA,
      allowedActors: input.allowedActors,
    }),
    registry.waitForDecision({
      interactionId: input.idB,
      allowedActors: input.allowedActors,
    }),
  ]);
  return { a, b };
}

export interface MultiGateHarnessInput {
  idA: string;
  idB: string;
  allowedActors?: Actor[];
  /** Explicit prefix for the first registry (omit to test auto-prefixing). */
  prefixA?: string;
  /** Explicit prefix for the second registry (omit to test auto-prefixing). */
  prefixB?: string;
}

/**
 * TWO registries in one execution — the composed-sub-flow case that would
 * clobber handlers without distinct prefixes. Exposes each registry's resolved
 * signal name via {@link harnessSignalNamesQuery} so the test can target them.
 */
export async function multiGateHarnessWorkflow(
  input: MultiGateHarnessInput,
): Promise<{ a: GateOutcome<unknown>; b: GateOutcome<unknown> }> {
  const registryA = createDecisionGateRegistry({ prefix: input.prefixA });
  const registryB = createDecisionGateRegistry({ prefix: input.prefixB });

  // Arm both gates (waitForDecision arms synchronously before awaiting), then
  // publish the resolved signal names — both are ready once this tick yields.
  const pendingA = registryA.waitForDecision({
    interactionId: input.idA,
    allowedActors: input.allowedActors,
  });
  const pendingB = registryB.waitForDecision({
    interactionId: input.idB,
    allowedActors: input.allowedActors,
  });
  workflow.setHandler(harnessSignalNamesQuery, () => [
    registryA.signalName,
    registryB.signalName,
  ]);

  const [a, b] = await Promise.all([pendingA, pendingB]);
  return { a, b };
}

export interface RaceHarnessInput {
  /**
   * `'sleep'` → the resolver yields PROCEED after `resolveAfterMs` (time-skipped),
   * so it wins when no signal is sent. `'never'` → the resolver blocks on a
   * timer-less condition, so a signal must win (the time-skipping server cannot
   * fast-forward a condition with no timer).
   */
  resolver: 'sleep' | 'never';
  resolveAfterMs?: number;
  timeoutMs?: number;
}

/**
 * Waits for a decision while racing an external resolver that yields PROCEED —
 * the EPP unlock pattern (poll detects the state, proceed without operator input).
 */
export async function raceHarnessWorkflow(
  input: RaceHarnessInput,
): Promise<GateOutcome<unknown>> {
  const registry = createDecisionGateRegistry();
  return registry.waitForDecision({
    allowedActors: ['ADMIN'],
    timeoutMs: input.timeoutMs,
    raceWith: async () => {
      if (input.resolver === 'sleep') {
        await workflow.sleep(input.resolveAfterMs ?? 0);
      } else {
        // Timer-less wait: never resolves on its own, so the signal wins.
        await workflow.condition(() => false);
      }
      return { action: 'PROCEED' };
    },
  });
}

export interface RunWithGateHarnessInput {
  /** Number of leading action invocations that throw before one succeeds. */
  failTimes: number;
  /**
   * Number of action invocations (after the throwing ones) that hang past
   * `actionTimeoutMs` before one succeeds — exercises the gate-owned action
   * deadline (the hanging poll is cancelled and the gate opens).
   */
  hangTimes?: number;
  /** How long a hanging action sleeps; should exceed `actionTimeoutMs`. */
  hangMs?: number;
  alertSeverity?: 'general' | 'critical';
  allowedActors?: Actor[];
  allowedActions?: GateAction[];
  timeoutMs?: number;
  /** Per-attempt action deadline forwarded to `runWithDecisionGate`. */
  actionTimeoutMs?: number;
  maxRetries?: number;
  /** When set, TIMEOUT returns this sentinel instead of throwing. */
  onTimeoutReturn?: unknown;
}

/** Drives `runWithDecisionGate` with a flaky action and reports attempt count. */
export async function runWithGateHarnessWorkflow(
  input: RunWithGateHarnessInput,
): Promise<{ result: unknown; attempts: number }> {
  const registry = createDecisionGateRegistry();
  const hangTimes = input.hangTimes ?? 0;
  let attempts = 0;
  const result = await runWithDecisionGate<
    { ok: true; attempts: number },
    unknown
  >({
    registry,
    action: async () => {
      attempts++;
      if (attempts <= input.failTimes) {
        // Non-retryable (like the production poll failures) so PROCEED's
        // passthrough re-throw fails the workflow terminally instead of looping
        // as a retryable workflow-task failure.
        throw workflow.ApplicationFailure.create({
          message: `harness action failure #${attempts}`,
          nonRetryable: true,
        });
      }
      if (attempts <= input.failTimes + hangTimes) {
        // Hangs past the action deadline; withTimeout cancels this sleep.
        await workflow.sleep(input.hangMs ?? 60_000);
      }
      return { ok: true, attempts };
    },
    alertMessage: 'harness guarded action failed',
    alertSeverity: input.alertSeverity,
    allowedActors: input.allowedActors,
    allowedActions: input.allowedActions,
    timeoutMs: input.timeoutMs,
    actionTimeoutMs: input.actionTimeoutMs,
    maxRetries: input.maxRetries,
    onTimeout:
      input.onTimeoutReturn !== undefined
        ? { kind: 'return', value: input.onTimeoutReturn }
        : { kind: 'throw' },
  });
  return { result, attempts };
}

export interface RunWithTestHarnessHarnessInput {
  /** Forwarded to `runWithTestHarness` — the master non-prod switch. */
  enabled?: boolean;
  /** Forwarded — the signal that forces a failure. */
  signalName?: string;
  /** Forwarded — leading sleep before the inner action runs. */
  delayMs?: number;
  /** The inner action sleeps this long before returning (so a fail-signal can win). */
  hangMs?: number;
  allowedActors?: Actor[];
}

/**
 * Drives `runWithDecisionGate` whose action is wrapped in `runWithTestHarness`,
 * so a test can fire the harness fail-signal and assert the gate opens. Uses the
 * default registry, so the existing `decisionGateSignal` / `decisionGateArmedQuery`
 * helpers drive the opened gate. `attempts` counts inner-action invocations (it
 * stays 0 if the failure happens during `delayMs`, before the inner action runs).
 */
export async function runWithTestHarnessHarnessWorkflow(
  input: RunWithTestHarnessHarnessInput,
): Promise<{ result: unknown; attempts: number }> {
  const registry = createDecisionGateRegistry();
  let attempts = 0;
  const result = await runWithDecisionGate<
    { ok: true; attempts: number },
    unknown
  >({
    registry,
    action: () =>
      runWithTestHarness(
        async () => {
          attempts++;
          if (input.hangMs) await workflow.sleep(input.hangMs);
          return { ok: true, attempts };
        },
        {
          enabled: input.enabled,
          signalName: input.signalName,
          delayMs: input.delayMs,
        },
      ),
    alertMessage: 'test-harness guarded action failed',
    allowedActors: input.allowedActors,
  });
  return { result, attempts };
}

export interface EscalatingPollHarnessInput {
  /** Poll returns ready once this many attempts have been made. */
  readyAfterAttempts: number;
  schedule: PollPhase[];
  overallTimeoutMs: number;
  /** When set, timeout returns this sentinel instead of throwing. */
  onTimeoutReturn?: { ready: true };
  /** When true, install the interrupt signal handler and wire it to the poll. */
  withInterrupt?: boolean;
}

export type EscalatingPollHarnessOutput =
  | { kind: 'result'; attempts: number; value: { ready: true } }
  | { kind: 'timeout' }
  | { kind: 'interrupted' };

/** Drives `escalatingPoll` and classifies the terminal outcome. */
export async function escalatingPollHarnessWorkflow(
  input: EscalatingPollHarnessInput,
): Promise<EscalatingPollHarnessOutput> {
  let interrupted = false;
  if (input.withInterrupt) {
    workflow.setHandler(harnessInterruptSignal, () => {
      interrupted = true;
    });
  }

  let attempts = 0;
  try {
    const value = await escalatingPoll<{ ready: true }>({
      label: 'harness-poll',
      schedule: input.schedule,
      overallTimeoutMs: input.overallTimeoutMs,
      onTimeout:
        input.onTimeoutReturn !== undefined
          ? { kind: 'return', value: input.onTimeoutReturn }
          : { kind: 'throw' },
      interrupt: input.withInterrupt ? () => interrupted : undefined,
      poll: async () => {
        attempts++;
        return attempts >= input.readyAfterAttempts ? { ready: true } : null;
      },
    });
    return { kind: 'result', attempts, value };
  } catch (err) {
    if (err instanceof PollInterrupted) return { kind: 'interrupted' };
    if (
      err instanceof workflow.ApplicationFailure &&
      err.type === 'polling/timeout'
    ) {
      return { kind: 'timeout' };
    }
    throw err;
  }
}
