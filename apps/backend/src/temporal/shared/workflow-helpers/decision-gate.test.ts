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
  it('re-runs the action on PROCEED until it succeeds', async () => {
    const handle = await testEnv.client.workflow.start(
      runWithGateHarnessWorkflow,
      {
        workflowId: nextId('run-proceed'),
        taskQueue: TASK_QUEUE,
        args: [{ failTimes: 1, allowedActors: ['ADMIN'] }],
      },
    );
    await waitUntilReady(handle);
    await handle.signal(decisionGateSignal, {
      actor: 'ADMIN',
      actorId: 'admin',
      action: 'PROCEED',
    });
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
    expect(generalAlertNamefi).toHaveBeenCalled();
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
      action: 'PROCEED',
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
      action: 'PROCEED',
    });
    const { result, attempts } = await handle.result();
    expect(attempts).toBe(2);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
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
