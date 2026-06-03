import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
};
const mockLeadgenLeadsTable = {
  id: 'leadgen_leads.id',
  runId: 'leadgen_leads.run_id',
  status: 'leadgen_leads.status',
  score: 'leadgen_leads.score',
  rank: 'leadgen_leads.rank',
  businessDomain: 'leadgen_leads.business_domain',
  updatedAt: 'leadgen_leads.updated_at',
};
const mockLeadgenRunsTable = {
  id: 'leadgen_runs.id',
  userId: 'leadgen_runs.user_id',
};
const mockUserContactsTable = {
  id: 'user_contacts.id',
  userId: 'user_contacts.user_id',
  firstName: 'user_contacts.first_name',
  lastName: 'user_contacts.last_name',
  organizationName: 'user_contacts.organization_name',
  createdAt: 'user_contacts.created_at',
  updatedAt: 'user_contacts.updated_at',
};

vi.mock('#lib/logger', () => ({
  createLogger: () => mockLogger,
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...conditions) => ({ conditions, type: 'and' })),
  asc: vi.fn((column) => ({ column, type: 'asc' })),
  count: vi.fn(() => ({ type: 'count' })),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  eq: vi.fn((column, value) => ({ column, type: 'eq', value })),
  inArray: vi.fn((column, values) => ({ column, type: 'inArray', values })),
  isNull: vi.fn((column) => ({ column, type: 'isNull' })),
  ne: vi.fn((column, value) => ({ column, type: 'ne', value })),
  or: vi.fn((...conditions) => ({ conditions, type: 'or' })),
  sql: vi.fn((strings, ...values) => ({ strings, type: 'sql', values })),
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
  LEADGEN_CONTACT_MODEL: 'gpt-5.4-mini',
  LEADGEN_EMAIL_MODEL: 'gpt-5.4-mini',
  generateLeadgenDomainThesisProfile: vi.fn(),
  generateLeadgenOpportunityTriages: vi.fn(),
  generateLeadgenContacts: vi.fn(),
  generateLeadgenEmailDraft: vi.fn(),
  getLeadgenContactModel: vi.fn(() => 'gpt-5.4-mini'),
  getLeadgenDomainProfileModel: vi.fn(() => 'gpt-5.4-mini'),
  getLeadgenPrimaryResearchModel: vi.fn(() => 'gpt-5.4-mini'),
  normalizeLeadgenDomain: vi.fn(),
  normalizeLeadgenEmail: vi.fn(),
  sanitizeCandidateSignals: vi.fn((signals) => signals),
  streamLeadgenCandidateSignals: vi.fn(),
}));

vi.mock('@namefi-astra/db', () => ({
  db: mockDb,
  leadgenContactsTable: {},
  leadgenEmailDraftsTable: {},
  leadgenEventsTable: {},
  leadgenLeadSignalsTable: {},
  leadgenLeadsTable: mockLeadgenLeadsTable,
  leadgenRunsTable: mockLeadgenRunsTable,
  userContactsTable: mockUserContactsTable,
}));

const { finalizeUntriagedLeadgenLeads, heartbeatLeadgenWhile } = await import(
  './leadgen.activities'
);
const { loadLeadgenSenderForRun } = await import(
  '../../services/leadgen/outreach.service'
);

function mockSelectResultOnce(
  result: unknown[],
  options: { orderBy?: boolean } = {},
) {
  const limit = vi.fn().mockResolvedValue(result);
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => (options.orderBy ? { orderBy } : { limit }));
  const from = vi.fn(() => ({ where }));

  mockDb.select.mockReturnValueOnce({ from });

  return { from, limit, orderBy, where };
}

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

    vi.advanceTimersByTime(2_500);
    expect(heartbeat).toHaveBeenCalledTimes(3);

    resolveOperation('done');
    await expect(promise).resolves.toBe('done');

    vi.advanceTimersByTime(2_000);
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

describe('finalizeUntriagedLeadgenLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks leftover checking leads as low priority before completion', async () => {
    const returning = vi.fn().mockResolvedValue([
      { id: 'lead-1', businessDomain: 'first.example' },
      { id: 'lead-2', businessDomain: 'second.example' },
    ]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const values = vi.fn().mockResolvedValue(undefined);

    mockDb.update.mockReturnValue({ set });
    mockDb.insert.mockReturnValue({ values });

    await expect(
      finalizeUntriagedLeadgenLeads({
        runId: 'run-1',
        reason: 'run-complete',
      }),
    ).resolves.toBe(2);

    expect(set).toHaveBeenCalledWith({
      status: 'low_priority',
      score: 0,
      rank: 3100,
      updatedAt: expect.any(Date),
    });
    expect(values).toHaveBeenCalledWith({
      runId: 'run-1',
      eventType: 'status',
      stage: 'triage',
      message: 'Marked 2 prospects for manual review.',
      payload: {
        reason: 'run-complete',
        finalizedLeadCount: 2,
        businessDomains: ['first.example', 'second.example'],
      },
      transient: false,
    });
  });

  it('does not write an event when no checking leads remain', async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));

    mockDb.update.mockReturnValue({ set });

    await expect(
      finalizeUntriagedLeadgenLeads({
        runId: 'run-1',
        reason: 'run-complete',
      }),
    ).resolves.toBe(0);

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

describe('loadLeadgenSenderForRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [
      {
        firstName: ' Alice ',
        lastName: ' Seller ',
        organizationName: 'Example Org',
      },
      'Alice Seller',
    ],
    [
      {
        firstName: null,
        lastName: null,
        organizationName: ' Example Org ',
      },
      'Example Org',
    ],
    [
      {
        firstName: null,
        lastName: null,
        organizationName: null,
      },
      null,
    ],
  ])('derives sender signature from profile contact %#', async (contact, expected) => {
    mockSelectResultOnce([{ userId: 'user-1' }]);
    mockSelectResultOnce([contact], { orderBy: true });

    await expect(loadLeadgenSenderForRun({ runId: 'run-1' })).resolves.toEqual({
      signature: expected,
    });
  });

  it('queries only usable profile rows with deterministic ordering', async () => {
    mockSelectResultOnce([{ userId: 'user-1' }]);
    const contactQuery = mockSelectResultOnce(
      [
        {
          firstName: 'Alice',
          lastName: null,
          organizationName: null,
        },
      ],
      { orderBy: true },
    );

    await loadLeadgenSenderForRun({ runId: 'run-1' });

    const whereCalls = contactQuery.where.mock.calls as unknown as Array<
      [unknown]
    >;
    const whereCondition = (whereCalls[0]?.[0] ?? null) as {
      conditions: unknown[];
      type: string;
    } | null;
    expect(whereCondition).toEqual(expect.objectContaining({ type: 'and' }));
    expect(whereCondition?.conditions[1]).toEqual(
      expect.objectContaining({ type: 'or' }),
    );
    const orderByCalls = contactQuery.orderBy.mock.calls as unknown[][];
    expect(orderByCalls[0]).toHaveLength(3);
  });
});
