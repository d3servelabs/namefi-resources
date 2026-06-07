import path from 'node:path';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { type Worker, Worker as TemporalWorker } from '@temporalio/worker';
import { type WorkflowHandle, WorkflowFailedError } from '@temporalio/client';
import { ApplicationFailure } from '@temporalio/common';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { TEMPORAL_QUEUES } from '../enums';
import {
  decisionGateArmedQuery,
  decisionGateSignal,
  decisionGateSignalFor,
  decisionGateSignalName,
} from './decision-gate';
import type { PollPhase } from './escalating-poller';
import {
  escalatingPollHarnessWorkflow,
  gateWaitHarnessWorkflow,
  harnessInterruptSignal,
  harnessSignalNamesQuery,
  multiGateHarnessWorkflow,
  raceHarnessWorkflow,
  routingHarnessWorkflow,
  runWithGateHarnessWorkflow,
  runWithTestHarnessHarnessWorkflow,
} from '../../workflows/test-workflows/decision-gate-harness.workflow';

/**
 * End-to-end tests for the decision gate and escalating poller using the
 * time-skipping test environment. Long gate timeouts and poll sleeps are
 * fast-forwarded automatically while the workflow is blocked on a timer.
 *
 * The worker runs on the DEFAULT task queue so the alert activities that
 * `runWithDecisionGate` proxies there (via typedProxyActivities) are served by
 * this same worker.
 */

const TASK_QUEUE = TEMPORAL_QUEUES.DEFAULT;

const generalAlertNamefi = vi.fn(async () => undefined);
const criticalAlertNamefi = vi.fn(async () => ({
  ticket: null,
  monitoringStarted: false,
}));

// The alert mocks are shared across the suite and some tests assert NOT-called;
// clear their call history before each test so assertions are order-independent.
beforeEach(() => {
  generalAlertNamefi.mockClear();
  criticalAlertNamefi.mockClear();
});

let testEnv: TestWorkflowEnvironment;
let worker: Worker;
let workerRun: Promise<void>;

let wfCounter = 0;
const nextId = (prefix: string): string => `${prefix}-${++wfCounter}`;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  worker = await TemporalWorker.create({
    connection: testEnv.nativeConnection,
    taskQueue: TASK_QUEUE,
    workflowsPath: path.join(
      import.meta.dirname,
      '../../workflows/test-workflows/decision-gate-harness.workflow.ts',
    ),
    activities: { generalAlertNamefi, criticalAlertNamefi },
  });
  workerRun = worker.run();
}, 240_000);

afterAll(async () => {
  worker?.shutdown();
  await workerRun?.catch(() => undefined);
  await testEnv?.teardown();
});

// Poll the registry's armed-gate query until the expected number of gates are
// armed, so a decision signal is never delivered before its gate exists.
async function waitUntilReady(
  handle: WorkflowHandle,
  expected = 1,
): Promise<void> {
  for (let i = 0; i < 600; i++) {
    let count = 0;
    try {
      count = (await handle.query(decisionGateArmedQuery)).count;
    } catch {
      // Query handler not registered yet — keep polling.
    }
    if (count >= expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('harness never reached the awaiting state');
}

// Reads the registry signal names a multi-registry harness publishes once both
// registries are created (and their gates armed).
async function waitForSignalNames(handle: WorkflowHandle): Promise<string[]> {
  for (let i = 0; i < 600; i++) {
    try {
      const names = await handle.query(harnessSignalNamesQuery);
      if (names.length >= 2) return names;
    } catch {
      // Query handler not registered yet — keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('harness never published signal names');
}

// Polls the armed-gate query until the (re-opened) gate's history reaches `len`
// entries — used to observe a gate that closed on RETRY and opened again.
async function waitForHistoryLength(handle: WorkflowHandle, len: number) {
  for (let i = 0; i < 600; i++) {
    try {
      const armed = await handle.query(decisionGateArmedQuery);
      const history = armed.gates[0]?.context?.history;
      if (history && history.length >= len) return armed;
    } catch {
      // Gate momentarily closed between opens — keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`gate history never reached length ${len}`);
}

describe('decision gate (time-skipping)', () => {
  it('resolves to TIMEOUT when no decision arrives before the deadline', async () => {
    const handle = await testEnv.client.workflow.start(
      gateWaitHarnessWorkflow,
      {
        workflowId: nextId('gate-timeout'),
        taskQueue: TASK_QUEUE,
        args: [{ timeoutMs: 7 * 24 * 60 * 60 * 1000 }],
      },
    );
    const outcome = await handle.result();
    expect(outcome.action).toBe('TIMEOUT');
    expect(outcome.signal).toBeNull();
  });

  it('resolves PROCEED from an authorized signal', async () => {
    const handle = await testEnv.client.workflow.start(
      gateWaitHarnessWorkflow,
      {
        workflowId: nextId('gate-proceed'),
        taskQueue: TASK_QUEUE,
        args: [{ allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin-1',
      action: 'PROCEED',
    });
    const outcome = await handle.result();
    expect(outcome.action).toBe('PROCEED');
    expect(outcome.signal?.actorId).toBe('admin-1');
  });

  it('ignores out-of-policy actors and resolves on the permitted one', async () => {
    const handle = await testEnv.client.workflow.start(
      gateWaitHarnessWorkflow,
      {
        workflowId: nextId('gate-actor'),
        taskQueue: TASK_QUEUE,
        args: [{ allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    // USER is not permitted → dropped, gate stays open.
    await handle.signal(decisionGateSignal, {
      actor: 'USER',
      actorId: 'user-1',
      action: 'PROCEED',
    });
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin-2',
      action: 'CANCEL',
    });
    const outcome = await handle.result();
    expect(outcome.action).toBe('CANCEL');
    expect(outcome.signal?.actor).toBe('ADMIN');
  });

  it('returns a validated RESPOND payload and rejects a malformed one', async () => {
    const handle = await testEnv.client.workflow.start(
      gateWaitHarnessWorkflow,
      {
        workflowId: nextId('gate-respond'),
        taskQueue: TASK_QUEUE,
        args: [{ allowedActors: ['ADMIN'], validateResponseShape: true }],
      },
    );
    await waitUntilReady(handle);
    // Malformed payload (no boolean `ok`) → rejected, gate stays open.
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin-3',
      action: 'RESPOND',
      response: { nope: 1 },
    });
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin-3',
      action: 'RESPOND',
      response: { ok: true },
    });
    const outcome = await handle.result();
    expect(outcome.action).toBe('RESPOND');
    expect(outcome).toMatchObject({ response: { ok: true } });
  });

  it('routes signals to the correct gate by interactionId', async () => {
    const handle = await testEnv.client.workflow.start(routingHarnessWorkflow, {
      workflowId: nextId('gate-routing'),
      taskQueue: TASK_QUEUE,
      args: [{ idA: 'gate-a', idB: 'gate-b', allowedActors: ['ADMIN'] }],
    });
    await waitUntilReady(handle, 2);

    // The armed-gate query exposes both wait-points and their policy.
    const armed = await handle.query(decisionGateArmedQuery);
    expect(armed.count).toBe(2);
    expect(armed.gates.map((gate) => gate.interactionId).sort()).toEqual([
      'gate-a',
      'gate-b',
    ]);
    expect(armed.gates.every((gate) => gate.allowedActors[0] === 'ADMIN')).toBe(
      true,
    );

    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'for-b',
      action: 'PROCEED',
      interactionId: 'gate-b',
    });
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'for-a',
      action: 'CANCEL',
      interactionId: 'gate-a',
    });
    const { a, b } = await handle.result();
    expect(a.signal?.actorId).toBe('for-a');
    expect(a.action).toBe('CANCEL');
    expect(b.signal?.actorId).toBe('for-b');
    expect(b.action).toBe('PROCEED');
  });
});

describe('decision gate raceWith (time-skipping)', () => {
  it('resolves the wait from the external resolver without a signal', async () => {
    const handle = await testEnv.client.workflow.start(raceHarnessWorkflow, {
      workflowId: nextId('gate-race-wins'),
      taskQueue: TASK_QUEUE,
      // Resolver fires after a long (time-skipped) delay; no signal is ever sent.
      args: [{ resolver: 'sleep', resolveAfterMs: 60 * 60 * 1000 }],
    });
    const outcome = await handle.result();
    expect(outcome.action).toBe('PROCEED');
    // External resolution carries no signal.
    expect(outcome.signal).toBeNull();
  });

  it('lets a signal win when it arrives before the resolver', async () => {
    const handle = await testEnv.client.workflow.start(raceHarnessWorkflow, {
      workflowId: nextId('gate-race-signal'),
      taskQueue: TASK_QUEUE,
      // Resolver never fires on its own — the signal must win.
      args: [{ resolver: 'never' }],
    });
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'beat-the-race',
      action: 'PROCEED',
    });
    const outcome = await handle.result();
    expect(outcome.action).toBe('PROCEED');
    expect(outcome.signal?.actorId).toBe('beat-the-race');
  });
});

describe('decision gate registry isolation (time-skipping)', () => {
  it('isolates two coexisting registries with explicit prefixes', async () => {
    const handle = await testEnv.client.workflow.start(
      multiGateHarnessWorkflow,
      {
        workflowId: nextId('gate-coexist'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            idA: 'g',
            idB: 'g',
            allowedActors: ['ADMIN'],
            prefixA: 'a',
            prefixB: 'b',
          },
        ],
      },
    );
    const names = await waitForSignalNames(handle);
    expect(names).toEqual([
      decisionGateSignalName('a'),
      decisionGateSignalName('b'),
    ]);

    // Both gates share interactionId 'g'; only the distinct signal names keep
    // the two registries from resolving each other's gate.
    await handle.signal(decisionGateSignalFor('a'), {
      actor: 'ADMIN',
      actorId: 'to-a',
      action: 'PROCEED',
    });
    await handle.signal(decisionGateSignalFor('b'), {
      actor: 'ADMIN',
      actorId: 'to-b',
      action: 'CANCEL',
    });
    const { a, b } = await handle.result();
    expect(a.action).toBe('PROCEED');
    expect(a.signal?.actorId).toBe('to-a');
    expect(b.action).toBe('CANCEL');
    expect(b.signal?.actorId).toBe('to-b');
  });

  it('auto-assigns a prefix to a second registry from the workflow type', async () => {
    const handle = await testEnv.client.workflow.start(
      multiGateHarnessWorkflow,
      {
        workflowId: nextId('gate-autoprefix'),
        taskQueue: TASK_QUEUE,
        args: [{ idA: 'g', idB: 'g', allowedActors: ['ADMIN'] }],
      },
    );
    const names = await waitForSignalNames(handle);
    // First registry keeps the default name; the second is auto-prefixed with
    // the workflow type so its handlers do not clobber the first.
    expect(names[0]).toBe(decisionGateSignalName());
    expect(names[1]).toBe(decisionGateSignalName('multiGateHarnessWorkflow'));

    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'to-default',
      action: 'PROCEED',
    });
    await handle.signal(decisionGateSignalFor('multiGateHarnessWorkflow'), {
      actor: 'ADMIN',
      actorId: 'to-auto',
      action: 'PROCEED',
    });
    const { a, b } = await handle.result();
    expect(a.signal?.actorId).toBe('to-default');
    expect(b.signal?.actorId).toBe('to-auto');
  });
});

describe('runWithDecisionGate (time-skipping)', () => {
  it('re-runs the action on RETRY until it succeeds', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-retry'),
        taskQueue: TASK_QUEUE,
        args: [{ failTimes: 1, allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RETRY',
    });
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
    expect(generalAlertNamefi).toHaveBeenCalled();
  });

  it('passes through the original failure on PROCEED (gate acts as if absent)', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-proceed-passthrough'),
        taskQueue: TASK_QUEUE,
        // Action always throws; PROCEED must re-throw that original error, not
        // re-run and not a generic decision-gate failure.
        args: [{ failTimes: 5, maxRetries: 5, allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'PROCEED',
    });
    const error = await handle.result().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(WorkflowFailedError);
    const cause = (error as WorkflowFailedError).cause;
    expect(cause).toBeInstanceOf(ApplicationFailure);
    // The original action failure, not the gate's own CANCEL/timeout failure.
    expect((cause as ApplicationFailure).message).toMatch(
      /harness action failure #1/,
    );
    expect((cause as ApplicationFailure).type).not.toBe(
      'decision-gate/cancelled',
    );
  });

  it('returns the RESPOND payload as the result', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-respond'),
        taskQueue: TASK_QUEUE,
        args: [{ failTimes: 1, allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { manual: 'override' },
    });
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(1);
    expect(result).toEqual({ manual: 'override' });
  });

  it('throws a non-retryable failure on CANCEL', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-cancel'),
        taskQueue: TASK_QUEUE,
        args: [{ failTimes: 1, allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'CANCEL',
    });
    // A workflow ApplicationFailure surfaces as a WorkflowFailedError whose
    // generic message is "Workflow execution failed"; the real message/type
    // lives on `.cause`.
    const error = await handle.result().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(WorkflowFailedError);
    const cause = (error as WorkflowFailedError).cause;
    expect(cause).toBeInstanceOf(ApplicationFailure);
    expect((cause as ApplicationFailure).type).toBe('decision-gate/cancelled');
    expect((cause as ApplicationFailure).message).toMatch(/cancelled/i);
    expect((cause as ApplicationFailure).nonRetryable).toBe(true);
  });

  it('escalates to a critical alert when configured', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-critical'),
        taskQueue: TASK_QUEUE,
        args: [
          { failTimes: 1, alertSeverity: 'critical', allowedActors: ['ADMIN'] },
        ],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RETRY',
    });
    await handle.result();
    expect(criticalAlertNamefi).toHaveBeenCalled();
  });

  it('opens the gate when the action exceeds actionTimeoutMs, then RESPOND resolves it', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-action-timeout-respond'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            failTimes: 0,
            // First attempt hangs 10 min; the 1 min action deadline cancels it.
            hangTimes: 1,
            hangMs: 600_000,
            actionTimeoutMs: 60_000,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    // Advance past the 1 min action deadline so the hanging poll is cancelled
    // and the gate opens (a query-loop would stall the server's auto-skip).
    await testEnv.sleep(90_000);
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { verified: 'SUCCESSFUL' },
    });
    const { result, attempts } = await handle.result();
    // The hanging attempt was cancelled, so the action ran exactly once.
    expect(attempts).toBe(1);
    expect(result).toEqual({ verified: 'SUCCESSFUL' });
    expect(generalAlertNamefi).toHaveBeenCalled();
  });

  it('re-runs the action on RETRY after an action-timeout until it succeeds', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-action-timeout-retry'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            failTimes: 0,
            hangTimes: 1,
            hangMs: 600_000,
            actionTimeoutMs: 60_000,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await testEnv.sleep(90_000);
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RETRY',
    });
    const { result, attempts } = await handle.result();
    // Attempt 1 hung (cancelled); attempt 2 (post-RETRY) does not hang and wins.
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
  });

  it('returns the result without opening a gate when the action finishes within actionTimeoutMs', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-action-within-deadline'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            failTimes: 0,
            // Action sleeps 1 min, well within the 10 min deadline → it succeeds.
            hangTimes: 1,
            hangMs: 60_000,
            actionTimeoutMs: 600_000,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    // Advance past the in-action sleep so it completes before the deadline.
    await testEnv.sleep(120_000);
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(1);
    expect(result).toMatchObject({ ok: true, attempts: 1 });
    // No deadline fired → no gate, no failure alert.
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });

  it('opens the gate on a normal action throw even with actionTimeoutMs set (not mislabeled as a timeout)', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-throw-with-timeout'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            // Throws immediately on attempt 1 (a real error, not a deadline).
            failTimes: 1,
            actionTimeoutMs: 60_000,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RETRY',
    });
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
  });
});

describe('decision gate auto-retry / history / evidence (time-skipping)', () => {
  it('auto-retries before opening the gate and succeeds without a human', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-auto-retry-ok'),
        taskQueue: TASK_QUEUE,
        // attempt 1 throws → auto-retry → attempt 2 succeeds; gate never opens.
        args: [
          {
            failTimes: 1,
            autoRetry: { maxAttempts: 1 },
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });

  it('opens the gate once the single auto-retry is exhausted, then RESPOND resolves it', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-auto-retry-exhausted'),
        taskQueue: TASK_QUEUE,
        // Fails twice: attempt 1 auto-retries, attempt 2 opens the gate.
        args: [
          {
            failTimes: 2,
            autoRetry: { maxAttempts: 1 },
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await waitUntilReady(handle);
    const armed = await handle.query(decisionGateArmedQuery);
    expect(armed.gates[0]?.context?.attempt).toBe(2);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { manual: 'override' },
    });
    const { result } = await handle.result();
    expect(result).toEqual({ manual: 'override' });
    expect(generalAlertNamefi).toHaveBeenCalled();
  });

  it('accumulates per-open history and records each resolution', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-history'),
        taskQueue: TASK_QUEUE,
        // Always throws so each RETRY re-opens the gate; capped so a stray loop ends.
        args: [{ failTimes: 5, maxRetries: 5, allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    const first = await handle.query(decisionGateArmedQuery);
    expect(first.gates[0]?.context?.history).toHaveLength(1);

    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RETRY',
    });
    // RETRY closes the first open, re-runs (fails), and re-opens with 2 entries.
    const second = await waitForHistoryLength(handle, 2);
    const history = second.gates[0]?.context?.history ?? [];
    expect(history).toHaveLength(2);
    expect(history[0]?.resolution?.action).toBe('RETRY');
    expect(history[0]?.resolution?.actor).toBe('ADMIN');
    expect(history[1]?.attempt).toBe(2);
    expect(history[1]?.resolution).toBeUndefined();

    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { done: true },
    });
    await handle.result();
  });

  it('surfaces gateKind and evidenceParams in the armed-gate context', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-evidence-tags'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            failTimes: 1,
            gateKind: 'register-or-import-poll',
            evidenceParams: { normalizedDomainName: 'example.com' },
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await waitUntilReady(handle);
    const armed = await handle.query(decisionGateArmedQuery);
    expect(armed.gates[0]?.context?.gateKind).toBe('register-or-import-poll');
    expect(armed.gates[0]?.context?.evidenceParams).toEqual({
      normalizedDomainName: 'example.com',
    });

    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RETRY',
    });
    await handle.result();
  });

  it('auto-retries when the shouldRetry predicate matches the failure', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-auto-retry-predicate-match'),
        taskQueue: TASK_QUEUE,
        // The failure message "harness action failure #1" includes "harness",
        // so the predicate allows the single auto-retry → attempt 2 succeeds.
        args: [
          {
            failTimes: 1,
            autoRetry: { maxAttempts: 1 },
            retryIfErrorIncludes: 'harness',
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });

  it('skips auto-retry and opens the gate when the predicate rejects the failure', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-auto-retry-predicate-miss'),
        taskQueue: TASK_QUEUE,
        // The predicate never matches, so the auto-retry budget is not consumed
        // and the gate opens on the very first failure (attempt 1).
        args: [
          {
            failTimes: 1,
            autoRetry: { maxAttempts: 1 },
            retryIfErrorIncludes: 'never-matches-this',
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await waitUntilReady(handle);
    const armed = await handle.query(decisionGateArmedQuery);
    expect(armed.gates[0]?.context?.attempt).toBe(1);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { manual: 'override' },
    });
    const { result } = await handle.result();
    expect(result).toEqual({ manual: 'override' });
    expect(generalAlertNamefi).toHaveBeenCalled();
  });

  it('opens the gate (never bypasses it) when the shouldRetry predicate throws', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-predicate-throws'),
        taskQueue: TASK_QUEUE,
        // A throwing predicate must be treated as "do not auto-retry": the gate
        // opens on the first failure rather than the throw escaping the catch.
        args: [
          {
            failTimes: 1,
            autoRetry: { maxAttempts: 1 },
            retryPredicateThrows: true,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await waitUntilReady(handle);
    const armed = await handle.query(decisionGateArmedQuery);
    expect(armed.gates[0]?.context?.attempt).toBe(1);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { manual: 'override' },
    });
    const { result } = await handle.result();
    expect(result).toEqual({ manual: 'override' });
    expect(generalAlertNamefi).toHaveBeenCalled();
  });
});

describe('runWithTestHarness (time-skipping)', () => {
  it('forces a failure on the fail-signal, opening the gate, then RESPOND resolves it', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithTestHarnessHarnessWorkflow,
      {
        workflowId: nextId('th-fail-respond'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            enabled: true,
            signalName: 'th-fail',
            // The inner action blocks so the fail-signal reliably wins.
            hangMs: 600_000,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    // Force the in-flight action to fail (buffered until the handler is armed).
    await handle.signal('th-fail');
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { verified: 'SUCCESSFUL' },
    });
    const { result, attempts } = await handle.result();
    // Inner action ran once (incremented) before the forced cancel.
    expect(attempts).toBe(1);
    expect(result).toEqual({ verified: 'SUCCESSFUL' });
    expect(generalAlertNamefi).toHaveBeenCalled();
  });

  it('returns normally when no fail-signal is sent', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithTestHarnessHarnessWorkflow,
      {
        workflowId: nextId('th-no-signal'),
        taskQueue: TASK_QUEUE,
        args: [
          { enabled: true, signalName: 'th-fail', allowedActors: ['ADMIN'] },
        ],
      },
    );
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(1);
    expect(result).toMatchObject({ ok: true, attempts: 1 });
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });

  it('is a passthrough when disabled (no handler, no gate)', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithTestHarnessHarnessWorkflow,
      {
        workflowId: nextId('th-disabled'),
        taskQueue: TASK_QUEUE,
        args: [
          { enabled: false, signalName: 'th-fail', allowedActors: ['ADMIN'] },
        ],
      },
    );
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(1);
    expect(result).toMatchObject({ ok: true, attempts: 1 });
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });

  it('fails during the delay window when signalled (inner action never runs)', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithTestHarnessHarnessWorkflow,
      {
        workflowId: nextId('th-delay-fail'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            enabled: true,
            signalName: 'th-fail',
            delayMs: 60_000,
            allowedActors: ['ADMIN'],
          },
        ],
      },
    );
    await handle.signal('th-fail');
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'RESPOND',
      response: { verified: 'SUCCESSFUL' },
    });
    const { result, attempts } = await handle.result();
    // Failed mid-delay, before the inner action ran.
    expect(attempts).toBe(0);
    expect(result).toEqual({ verified: 'SUCCESSFUL' });
  });

  it('runs the action after the delay when not signalled', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithTestHarnessHarnessWorkflow,
      {
        workflowId: nextId('th-delay-run'),
        taskQueue: TASK_QUEUE,
        args: [{ enabled: true, signalName: 'th-fail', delayMs: 60_000 }],
      },
    );
    // Fast-forward past the delay so the action runs and returns.
    await testEnv.sleep(120_000);
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(1);
    expect(result).toMatchObject({ ok: true, attempts: 1 });
    expect(generalAlertNamefi).not.toHaveBeenCalled();
  });
});

describe('escalatingPoll (time-skipping)', () => {
  const schedule: PollPhase[] = [
    { interval: '10 seconds', untilElapsedMs: 30_000 },
    { interval: '1 minute', untilElapsedMs: 120_000 },
  ];

  it('resolves once the poll reports ready', async () => {
    const handle = await testEnv.client.workflow.start(
      escalatingPollHarnessWorkflow,
      {
        workflowId: nextId('poll-ready'),
        taskQueue: TASK_QUEUE,
        args: [{ readyAfterAttempts: 3, schedule, overallTimeoutMs: 600_000 }],
      },
    );
    const outcome = await handle.result();
    expect(outcome.kind).toBe('result');
    if (outcome.kind === 'result') {
      expect(outcome.attempts).toBe(3);
      expect(outcome.value).toEqual({ ready: true });
    }
  });

  it('times out when the poll never becomes ready', async () => {
    const handle = await testEnv.client.workflow.start(
      escalatingPollHarnessWorkflow,
      {
        workflowId: nextId('poll-timeout'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            readyAfterAttempts: Number.MAX_SAFE_INTEGER,
            schedule,
            overallTimeoutMs: 120_000,
          },
        ],
      },
    );
    const outcome = await handle.result();
    expect(outcome.kind).toBe('timeout');
  });

  it('stops early when interrupted by a signal', async () => {
    const handle = await testEnv.client.workflow.start(
      escalatingPollHarnessWorkflow,
      {
        workflowId: nextId('poll-interrupt'),
        taskQueue: TASK_QUEUE,
        args: [
          {
            readyAfterAttempts: Number.MAX_SAFE_INTEGER,
            schedule,
            overallTimeoutMs: 600_000,
            withInterrupt: true,
          },
        ],
      },
    );
    await handle.signal(harnessInterruptSignal);
    const outcome = await handle.result();
    expect(outcome.kind).toBe('interrupted');
  });
});
