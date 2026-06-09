import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
};
const mockTemporalStart = vi.fn();

const mockLeadgenContactsTable = {
  id: 'leadgen_contacts.id',
  leadId: 'leadgen_contacts.lead_id',
};
const mockLeadgenEmailDraftsTable = {
  contactId: 'leadgen_email_drafts.contact_id',
};
const mockLeadgenEventsTable = {
  runId: 'leadgen_events.run_id',
};
const mockLeadgenLeadsTable = {
  contactDiscoveryAttemptedAt:
    'leadgen_leads.contact_discovery_attempted_at',
  id: 'leadgen_leads.id',
  runId: 'leadgen_leads.run_id',
  status: 'leadgen_leads.status',
  updatedAt: 'leadgen_leads.updated_at',
};
const mockLeadgenRunsTable = {
  domain: 'leadgen_runs.domain',
  id: 'leadgen_runs.id',
  status: 'leadgen_runs.status',
  userId: 'leadgen_runs.user_id',
};

vi.mock('@namefi-astra/common/email-campaigns', () => ({
  EMAIL_CAMPAIGN_KEYS: {
    DOMAIN_TRAFFIC_SURGE: 'domain-traffic-surge',
  },
}));

vi.mock('@namefi-astra/db', () => ({
  db: mockDb,
  leadgenContactsTable: mockLeadgenContactsTable,
  leadgenEmailDraftsTable: mockLeadgenEmailDraftsTable,
  leadgenEventsTable: mockLeadgenEventsTable,
  leadgenLeadsTable: mockLeadgenLeadsTable,
  leadgenRunsTable: mockLeadgenRunsTable,
}));

vi.mock('@namefi-astra/utils', () => ({
  namefiNormalizedDomainSchema: {
    parse: vi.fn((value) => value),
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...conditions) => ({ conditions, type: 'and' })),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  eq: vi.fn((column, value) => ({ column, type: 'eq', value })),
  inArray: vi.fn((column, values) => ({ column, type: 'inArray', values })),
  sql: vi.fn((strings, ...values) => ({ strings, type: 'sql', values })),
}));

vi.mock('#lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('#temporal/client', () => ({
  temporalClient: {
    workflow: {
      start: mockTemporalStart,
    },
  },
}));

vi.mock('#temporal/shared', () => ({
  TEMPORAL_QUEUES: {
    DEFAULT: 'default',
  },
}));

vi.mock('#temporal/workflows/leadgen.workflow', () => ({
  runLeadgenWorkflow: vi.fn(),
}));

const {
  LeadgenRunNoLongerRetryableError,
  retryFailedLeadgenRunForUser,
} = await import('./runs');
const { runLeadgenWorkflow } = await import(
  '#temporal/workflows/leadgen.workflow'
);

const startedAt = new Date('2026-06-01T10:00:00Z');
const finishedAt = new Date('2026-06-01T10:05:00Z');
const tokenUsage = [
  {
    model: 'gpt-5.4',
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150,
  },
];

function failedRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run-1',
    userId: 'user-1',
    domain: 'seller.com',
    reasoningEffort: 'medium',
    workflowId: 'leadgen-run-1',
    status: 'FAILED',
    errorMessage: 'old failure',
    startedAt,
    finishedAt,
    tokenUsage,
    createdAt: startedAt,
    updatedAt: finishedAt,
    ...overrides,
  };
}

function mockSelectResultOnce(result: unknown[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));

  mockDb.select.mockReturnValueOnce({ from });

  return { from, limit, where };
}

function mockUpdateReturningOnce(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));

  mockDb.update.mockReturnValueOnce({ set });

  return { returning, set, where };
}

function mockUpdateWhereOnce(result?: unknown) {
  const where = vi.fn().mockResolvedValue(result);
  const set = vi.fn(() => ({ where }));

  mockDb.update.mockReturnValueOnce({ set });

  return { set, where };
}

function mockInsertOnce(result?: unknown) {
  const values = vi.fn().mockResolvedValue(result);

  mockDb.insert.mockReturnValueOnce({ values });

  return { values };
}

describe('retryFailedLeadgenRunForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requeues a failed run, resets retryable contact claims, and restarts Temporal', async () => {
    const run = failedRun();
    const queuedRun = {
      ...run,
      status: 'QUEUED',
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      tokenUsage: [],
    };
    mockSelectResultOnce([run]);
    const queueUpdate = mockUpdateReturningOnce([queuedRun]);
    const contactReset = mockUpdateWhereOnce();
    mockTemporalStart.mockResolvedValueOnce(undefined);
    const retryEvent = mockInsertOnce();
    mockSelectResultOnce([queuedRun]);

    const result = await retryFailedLeadgenRunForUser({
      runId: run.id,
      userId: run.userId,
    });

    expect(result).toEqual(queuedRun);
    expect(queueUpdate.set).toHaveBeenCalledWith({
      status: 'QUEUED',
      workflowId: run.workflowId,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      tokenUsage: [],
      updatedAt: expect.any(Date),
    });
    expect(contactReset.set).toHaveBeenCalledWith({
      contactDiscoveryAttemptedAt: null,
      updatedAt: expect.any(Date),
    });
    expect(mockTemporalStart).toHaveBeenCalledWith(runLeadgenWorkflow, {
      args: [
        {
          runId: run.id,
          userId: run.userId,
          domain: run.domain,
          reasoningEffort: run.reasoningEffort,
        },
      ],
      taskQueue: 'default',
      workflowId: run.workflowId,
      workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
      workflowIdConflictPolicy: 'FAIL',
    });
    expect(retryEvent.values).toHaveBeenCalledWith({
      runId: run.id,
      eventType: 'status',
      stage: 'intent',
      message: 'Retrying buyer search.',
      payload: {},
    });
  });

  it('does not start Temporal when another retry already moved the run', async () => {
    const run = failedRun();
    mockSelectResultOnce([run]);
    mockUpdateReturningOnce([]);

    await expect(
      retryFailedLeadgenRunForUser({
        runId: run.id,
        userId: run.userId,
      }),
    ).rejects.toBeInstanceOf(LeadgenRunNoLongerRetryableError);

    expect(mockTemporalStart).not.toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalledTimes(1);
  });

  it('restores failed run state when Temporal cannot start', async () => {
    const run = failedRun();
    const queuedRun = {
      ...run,
      status: 'QUEUED',
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      tokenUsage: [],
    };
    const startError = new Error('Temporal start failed');
    mockSelectResultOnce([run]);
    mockUpdateReturningOnce([queuedRun]);
    mockUpdateWhereOnce();
    mockTemporalStart.mockRejectedValueOnce(startError);
    const restoreUpdate = mockUpdateWhereOnce();

    await expect(
      retryFailedLeadgenRunForUser({
        runId: run.id,
        userId: run.userId,
      }),
    ).rejects.toThrow(startError);

    expect(restoreUpdate.set).toHaveBeenCalledWith({
      status: 'FAILED',
      errorMessage: startError.message,
      startedAt: run.startedAt,
      finishedAt: expect.any(Date),
      tokenUsage: run.tokenUsage,
      updatedAt: expect.any(Date),
    });
  });
});
