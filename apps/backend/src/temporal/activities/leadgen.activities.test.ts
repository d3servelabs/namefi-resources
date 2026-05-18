import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('@temporalio/activity', () => ({
  Context: {
    current: vi.fn(() => ({
      cancellationSignal: new AbortController().signal,
      heartbeat: vi.fn(),
    })),
  },
}));

vi.mock('@namefi-astra/ai', () => ({
  generateLeadgenDomainThesisProfile: vi.fn(),
  generateLeadgenOpportunityTriages: vi.fn(),
  generateLeadgenContacts: vi.fn(),
  generateLeadgenEmailDraft: vi.fn(),
  getLeadgenPrimaryResearchModel: vi.fn(() => 'gpt-5.5'),
  normalizeLeadgenDomain: vi.fn(),
  normalizeLeadgenEmail: vi.fn(),
  sanitizeCandidateSignals: vi.fn((signals) => signals),
  streamLeadgenCandidateSignals: vi.fn(),
}));

vi.mock('@namefi-astra/db', () => ({
  db: {},
  leadgenContactsTable: {},
  leadgenEmailDraftsTable: {},
  leadgenEventsTable: {},
  leadgenLeadSignalsTable: {},
  leadgenLeadsTable: {},
  leadgenRunsTable: {},
}));

const { heartbeatLeadgenWhile } = await import('./leadgen.activities');

describe('heartbeatLeadgenWhile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('heartbeats periodically while the operation is pending', async () => {
    vi.useFakeTimers();

    const heartbeat = vi.fn();
    let resolveOperation!: (value: string) => void;
    const promise = heartbeatLeadgenWhile(
      () =>
        new Promise<string>((resolve) => {
          resolveOperation = resolve;
        }),
      { stage: 'search' },
      1_000,
      {
        cancellationSignal: new AbortController().signal,
        heartbeat,
      },
    );

    expect(heartbeat).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2_500);
    expect(heartbeat).toHaveBeenCalledTimes(3);

    resolveOperation('done');
    await expect(promise).resolves.toBe('done');

    await vi.advanceTimersByTimeAsync(2_000);
    expect(heartbeat).toHaveBeenCalledTimes(3);
  });

  it('aborts the in-flight operation when the activity is cancelled', async () => {
    const cancellationController = new AbortController();
    let operationSignal: AbortSignal | undefined;

    const promise = heartbeatLeadgenWhile(
      (abortSignal) => {
        operationSignal = abortSignal;

        return new Promise((_resolve, reject) => {
          abortSignal.addEventListener(
            'abort',
            () => {
              reject(new Error('operation-aborted'));
            },
            { once: true },
          );
        });
      },
      { stage: 'contacts' },
      1_000,
      {
        cancellationSignal: cancellationController.signal,
        heartbeat: vi.fn(),
      },
    );

    cancellationController.abort('cancelled');

    await expect(promise).rejects.toThrow('activity-cancelled');
    expect(operationSignal?.aborted).toBe(true);
  });

  it('fails fast when heartbeating fails and does not start the operation', async () => {
    const heartbeatError = new Error('heartbeat-failed');
    const operation = vi.fn();

    await expect(
      heartbeatLeadgenWhile(operation, { stage: 'intent' }, 1_000, {
        cancellationSignal: new AbortController().signal,
        heartbeat: vi.fn(() => {
          throw heartbeatError;
        }),
      }),
    ).rejects.toThrow('heartbeat-failed');

    expect(operation).not.toHaveBeenCalled();
    expect(mockLogger.debug).toHaveBeenCalledWith(
      { details: { stage: 'intent' }, error: heartbeatError },
      'Leadgen activity heartbeat failed; aborting in-flight work',
    );
  });
});
