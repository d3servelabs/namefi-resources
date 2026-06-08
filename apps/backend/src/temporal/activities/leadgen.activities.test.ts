import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};
const mockDb = {
  execute: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
};
const mockLeadgenContactsTable = {
  id: 'leadgen_contacts.id',
  leadId: 'leadgen_contacts.lead_id',
  email: 'leadgen_contacts.email',
  name: 'leadgen_contacts.name',
  title: 'leadgen_contacts.title',
  sourceUrl: 'leadgen_contacts.source_url',
  context: 'leadgen_contacts.context',
  metadata: 'leadgen_contacts.metadata',
  createdAt: 'leadgen_contacts.created_at',
  updatedAt: 'leadgen_contacts.updated_at',
};
const mockLeadgenEmailDraftsTable = {
  contactId: 'leadgen_email_drafts.contact_id',
};
const mockLeadgenEventsTable = {
  runId: 'leadgen_events.run_id',
};
const mockLeadgenLeadSignalsTable = {
  createdAt: 'leadgen_lead_signals.created_at',
  evidenceSnippet: 'leadgen_lead_signals.evidence_snippet',
  evidenceUrl: 'leadgen_lead_signals.evidence_url',
  leadId: 'leadgen_lead_signals.lead_id',
  signalType: 'leadgen_lead_signals.signal_type',
};
const mockLeadgenLeadsTable = {
  id: 'leadgen_leads.id',
  runId: 'leadgen_leads.run_id',
  status: 'leadgen_leads.status',
  score: 'leadgen_leads.score',
  businessDomain: 'leadgen_leads.business_domain',
  contactDiscoveryAttemptedAt: 'leadgen_leads.contact_discovery_attempted_at',
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
  isNotNull: vi.fn((column) => ({ column, type: 'isNotNull' })),
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
  leadgenContactsTable: mockLeadgenContactsTable,
  leadgenEmailDraftsTable: mockLeadgenEmailDraftsTable,
  leadgenEventsTable: mockLeadgenEventsTable,
  leadgenLeadSignalsTable: mockLeadgenLeadSignalsTable,
  leadgenLeadsTable: mockLeadgenLeadsTable,
  leadgenRunsTable: mockLeadgenRunsTable,
  userContactsTable: mockUserContactsTable,
}));

const leadgenAi = await import('@namefi-astra/ai');
const {
  claimLeadgenContactDiscoveryLeads,
  finalizeUntriagedLeadgenLeads,
  heartbeatLeadgenWhile,
} = await import('./leadgen.activities');
const { discoverLeadgenContactsAndDraft, loadLeadgenSenderForRun } =
  await import('../../services/leadgen/outreach.service');

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

function mockOrderBySelectResultOnce(result: unknown[]) {
  const orderBy = vi.fn().mockResolvedValue(result);
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));

  mockDb.select.mockReturnValueOnce({ from });

  return { from, orderBy, where };
}

function mockJoinSelectResultOnce(result: unknown[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const orderBy = vi.fn(() => ({ limit }));
  const where = vi.fn(() => ({ orderBy }));
  const innerJoin = vi.fn(() => ({ innerJoin, where }));
  const from = vi.fn(() => ({ innerJoin }));

  mockDb.select.mockReturnValueOnce({ from });

  return { from, innerJoin, limit, orderBy, where };
}

function mockUpdateChainOnce(result: unknown[] = []) {
  const returning = vi.fn().mockResolvedValue(result);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));

  mockDb.update.mockReturnValueOnce({ set });

  return { returning, set, where };
}

function mockInsertReturningChainOnce(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);
  const onConflictDoUpdate = vi.fn((_args: unknown) => ({ returning }));
  const values = vi.fn((_args: unknown) => ({ onConflictDoUpdate }));

  mockDb.insert.mockReturnValueOnce({ values });

  return { onConflictDoUpdate, returning, values };
}

function mockInsertValuesChainOnce() {
  const values = vi.fn().mockResolvedValue(undefined);

  mockDb.insert.mockReturnValueOnce({ values });

  return { values };
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

describe('claimLeadgenContactDiscoveryLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes budget checks and claims only the remaining unattempted leads', async () => {
    const claimedLeads = [
      { id: 'lead-1', businessDomain: 'first.example' },
      { id: 'lead-2', businessDomain: 'second.example' },
    ];
    const execute = vi.fn().mockResolvedValue(undefined);
    const countWhere = vi.fn().mockResolvedValue([{ value: 3 }]);
    const countFrom = vi.fn(() => ({ where: countWhere }));
    const subqueryLimit = vi.fn(() => ({ kind: 'lead-claim-subquery' }));
    const subqueryOrderBy = vi.fn(() => ({ limit: subqueryLimit }));
    const subqueryWhere = vi.fn(() => ({ orderBy: subqueryOrderBy }));
    const subqueryFrom = vi.fn(() => ({ where: subqueryWhere }));
    const returning = vi.fn().mockResolvedValue(claimedLeads);
    const updateWhere = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where: updateWhere }));
    const update = vi.fn(() => ({ set }));
    const select = vi
      .fn()
      .mockReturnValueOnce({ from: countFrom })
      .mockReturnValueOnce({ from: subqueryFrom });
    const tx = { execute, select, update };

    mockDb.transaction.mockImplementationOnce(async (callback) => callback(tx));

    await expect(
      claimLeadgenContactDiscoveryLeads({
        runId: 'run-1',
        contactDiscoveryLimit: 5,
      }),
    ).resolves.toEqual({
      leads: claimedLeads,
      remainingContactSearches: 2,
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({
      contactDiscoveryAttemptedAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(subqueryLimit).toHaveBeenCalledWith(2);
    expect(returning).toHaveBeenCalledTimes(1);
  });

  it('does not claim more leads after the discovery budget is exhausted', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const countWhere = vi.fn().mockResolvedValue([{ value: 5 }]);
    const countFrom = vi.fn(() => ({ where: countWhere }));
    const tx = {
      execute,
      select: vi.fn().mockReturnValueOnce({ from: countFrom }),
      update: vi.fn(),
    };

    mockDb.transaction.mockImplementationOnce(async (callback) => callback(tx));

    await expect(
      claimLeadgenContactDiscoveryLeads({
        runId: 'run-1',
        contactDiscoveryLimit: 5,
      }),
    ).resolves.toEqual({
      leads: [],
      remainingContactSearches: 0,
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(tx.update).not.toHaveBeenCalled();
  });
});

describe('discoverLeadgenContactsAndDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (leadgenAi.normalizeLeadgenEmail as Mock).mockImplementation((email) =>
      String(email).trim().toLowerCase(),
    );
  });

  it('preserves rich contact fields and notes when rediscovery returns sparse data', async () => {
    (leadgenAi.generateLeadgenContacts as Mock).mockResolvedValue({
      output: [
        {
          domain: 'buyer.example',
          contacts: [
            {
              email: ' Lead@Buyer.Example ',
              name: null,
              title: null,
              sourceUrl: null,
              context: null,
            },
          ],
          notes: null,
        },
      ],
    });
    mockOrderBySelectResultOnce([]);
    mockJoinSelectResultOnce([]);
    const contactInsert = mockInsertReturningChainOnce([
      {
        id: 'contact-1',
        leadId: 'lead-1',
        email: 'lead@buyer.example',
        name: 'Existing Name',
        title: 'Existing Title',
        sourceUrl: 'https://buyer.example/team',
        context: 'Existing context',
        metadata: { contactDiscoveryNotes: 'Existing notes' },
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    mockInsertValuesChainOnce();
    mockUpdateChainOnce();

    await discoverLeadgenContactsAndDraft({
      runId: 'run-1',
      sourceDomain: 'seller.example',
      reasoningEffort: 'low',
      draftEmails: false,
      sender: { signature: null },
      lead: {
        id: 'lead-1',
        businessDomain: 'buyer.example',
      } as never,
    });

    const conflictUpdate = contactInsert.onConflictDoUpdate.mock
      .calls[0]?.[0] as
      | {
          set: {
            context: unknown;
            metadata: unknown;
            name: unknown;
            sourceUrl: unknown;
            title: unknown;
          };
        }
      | undefined;
    expect(conflictUpdate?.set.name).toBe(mockLeadgenContactsTable.name);
    expect(conflictUpdate?.set.title).toBe(mockLeadgenContactsTable.title);
    expect(conflictUpdate?.set.sourceUrl).toBe(
      mockLeadgenContactsTable.sourceUrl,
    );
    expect(conflictUpdate?.set.context).toBe(mockLeadgenContactsTable.context);
    expect(JSON.stringify(conflictUpdate?.set.metadata)).not.toContain(
      'contactDiscoveryNotes',
    );
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
