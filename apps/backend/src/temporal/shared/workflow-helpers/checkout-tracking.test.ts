import { beforeEach, describe, expect, it, vi } from 'vitest';

const workflowMocks = {
  patched: vi.fn(),
  deprecatePatch: vi.fn(),
  defineQuery: vi.fn((name: string) => name),
  defineSignal: vi.fn((name: string) => name),
  proxyActivities: vi.fn(() => ({})),
  setHandler: vi.fn(),
  upsertMemo: vi.fn(),
  upsertSearchAttributes: vi.fn(),
  sleep: vi.fn(),
  condition: vi.fn(),
  executeChild: vi.fn(),
  startChild: vi.fn(),
  workflowInfo: vi.fn(() => ({ workflowId: 'test-workflow' })),
  isCancellation: vi.fn(() => false),
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  ApplicationFailure: class ApplicationFailure extends Error {
    static create({ message }: { message?: string }) {
      return new ApplicationFailure(message);
    }
  },
  TemporalFailure: class TemporalFailure extends Error {},
  ParentClosePolicy: {
    PARENT_CLOSE_POLICY_ABANDON: 'PARENT_CLOSE_POLICY_ABANDON',
  },
  CancellationScope: {
    cancellable: vi.fn((callback: () => unknown) => callback()),
    current: vi.fn(() => ({
      cancelRequested: Promise.resolve(),
    })),
    nonCancellable: vi.fn((callback: () => unknown) => callback()),
  },
};

vi.mock('@temporalio/workflow', () => workflowMocks);

const { resolveWorkflowCheckoutTracking } = await import('./checkout-tracking');

describe('resolveWorkflowCheckoutTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workflowMocks.patched.mockReturnValue(false);
  });

  it('defaults tracking on without identity propagation', () => {
    expect(resolveWorkflowCheckoutTracking()).toEqual({
      trackGaEvents: true,
      reason: 'DEFAULT',
      identity: {},
    });
    expect(workflowMocks.deprecatePatch).toHaveBeenCalledWith(
      'toggle-tracking',
    );
  });

  it('includes GA identity only behind the existing identity patch', () => {
    workflowMocks.patched.mockImplementation(
      (patchId: string) => patchId === 'ga-client-id-propagation-v1',
    );

    expect(
      resolveWorkflowCheckoutTracking({
        trackGaEvents: true,
        reason: 'API',
        clientId: '123.456',
        sessionId: 1716012345,
        eventSource: 'api',
      }),
    ).toEqual({
      trackGaEvents: true,
      reason: 'API',
      identity: {
        clientId: '123.456',
        sessionId: 1716012345,
        eventSource: 'api',
      },
    });
  });

  it('keeps active toggle-tracking patch behavior for parking workflows', () => {
    workflowMocks.patched.mockReturnValue(false);

    expect(
      resolveWorkflowCheckoutTracking(
        {
          trackGaEvents: false,
          reason: 'PRIVACY',
        },
        { toggleTrackingPatch: 'active' },
      ),
    ).toEqual({
      trackGaEvents: true,
      reason: 'PRIVACY',
      identity: {},
    });

    workflowMocks.patched.mockImplementation(
      (patchId: string) => patchId === 'toggle-tracking',
    );

    expect(
      resolveWorkflowCheckoutTracking(
        {
          trackGaEvents: false,
          reason: 'PRIVACY',
        },
        { toggleTrackingPatch: 'active' },
      ),
    ).toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
      identity: {},
    });
  });
});
