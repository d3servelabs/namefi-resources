import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { describe, expect, it } from 'vitest';

import {
  leadgenUserSignalEvidenceByState,
  leadgenUserSignalTypeByState,
  type LeadgenUserSignalState,
} from '@namefi-astra/common/contract/leadgen-contract';
import {
  buildLeadPresentation,
  buildLeadPresentationModel,
  canPrepareLeadgenOutreach,
  getLeadUserSignalState,
  type LeadgenLead,
} from './leadgen-presentation';

const sourceDomain = 'example.com' as NamefiNormalizedDomain;
const baseDate = new Date('2026-05-18T00:00:00Z');

const baseLead = {
  id: 'lead-1',
  runId: 'run-1',
  businessDomain: 'buyer.com',
  companyName: 'Buyer',
  status: 'checking',
  score: 0,
  riskLevel: 'low',
  riskNote: null,
  contactReadiness: 'not_searched',
  rationale: 'Initial rationale.',
  content: 'Initial content.',
  rank: 1,
  createdAt: baseDate,
  updatedAt: baseDate,
  signals: [],
  contacts: [],
  drafts: [],
} satisfies LeadgenLead;

function lead(overrides: Partial<LeadgenLead>) {
  return {
    ...baseLead,
    ...overrides,
  } satisfies LeadgenLead;
}

function userSignal(
  state: LeadgenUserSignalState,
  updatedAt: Date,
): LeadgenLead['signals'][number] {
  return {
    id: `${state}-signal`,
    runId: 'run-1',
    leadId: 'lead-1',
    signalType: leadgenUserSignalTypeByState[state],
    evidenceUrl: null,
    evidenceSnippet: leadgenUserSignalEvidenceByState[state],
    createdAt: baseDate,
    updatedAt,
  };
}

describe('buildLeadPresentation', () => {
  it('maps contact_now with contacts to ready to contact', () => {
    const presentation = buildLeadPresentation(
      lead({
        status: 'contact_now',
        score: 88,
        contacts: [
          {
            id: 'contact-1',
            runId: 'run-1',
            leadId: 'lead-1',
            businessDomain: 'buyer.com',
            email: 'ceo@buyer.com',
            name: null,
            title: null,
            sourceUrl: null,
            context: null,
            notes: null,
            errorMessage: null,
            fromCache: false,
            createdAt: new Date('2026-05-18T00:00:00Z'),
            updatedAt: new Date('2026-05-18T00:00:00Z'),
          },
        ],
      }),
    );

    expect(presentation.group).toBe('ranked');
    expect(presentation.action).toBe('ready_to_contact');
  });

  it('maps contact readiness fallback to ready to contact', () => {
    const presentation = buildLeadPresentation(
      lead({
        status: 'contact_now',
        score: 78,
        contactReadiness: 'generic_fallback',
      }),
    );

    expect(presentation.action).toBe('ready_to_contact');
  });

  it('maps contact_now without contacts to finding contact', () => {
    const presentation = buildLeadPresentation(
      lead({
        status: 'contact_now',
        score: 80,
        contactReadiness: 'not_searched',
      }),
    );

    expect(presentation.group).toBe('ranked');
    expect(presentation.action).toBe('finding_contact');
  });

  it('keeps checking leads separate and puts reviewed leads in the ranked list', () => {
    expect(buildLeadPresentation(baseLead).group).toBe('checking');
    expect(buildLeadPresentation(lead({ status: 'suppressed' })).group).toBe(
      'ranked',
    );
  });
});

describe('buildLeadPresentationModel', () => {
  it('uses one count model for ranked and pending prospects', () => {
    const model = buildLeadPresentationModel({
      id: 'run-1',
      userId: 'user-1',
      domain: sourceDomain,
      status: 'RUNNING',
      reasoningEffort: 'medium',
      workflowId: null,
      startedAt: new Date('2026-05-18T00:00:00Z'),
      finishedAt: null,
      errorMessage: null,
      summary: null,
      leadCount: 4,
      contactCount: 0,
      draftCount: 0,
      tokenUsage: [],
      createdAt: new Date('2026-05-18T00:00:00Z'),
      updatedAt: new Date('2026-05-18T00:00:00Z'),
      intentQueries: [],
      events: [],
      leads: [
        lead({ id: 'top', status: 'contact_now', score: 80 }),
        lead({ id: 'secondary', status: 'low_priority', score: 45 }),
        lead({ id: 'checking', status: 'checking' }),
        lead({ id: 'suppressed', status: 'suppressed' }),
      ],
    });

    expect(model.counts).toMatchObject({
      prospects: 4,
      ranked: 3,
      checking: 1,
      bookmarked: 0,
      visibleProspects: 4,
      hidden: 0,
    });
  });

  it('groups bookmarked and hidden prospects from the latest user signal', () => {
    const model = buildLeadPresentationModel({
      id: 'run-1',
      userId: 'user-1',
      domain: sourceDomain,
      status: 'SUCCEEDED',
      reasoningEffort: 'medium',
      workflowId: null,
      startedAt: new Date('2026-05-18T00:00:00Z'),
      finishedAt: new Date('2026-05-18T00:01:00Z'),
      errorMessage: null,
      summary: null,
      leadCount: 3,
      contactCount: 0,
      draftCount: 0,
      tokenUsage: [],
      createdAt: new Date('2026-05-18T00:00:00Z'),
      updatedAt: new Date('2026-05-18T00:01:00Z'),
      intentQueries: [],
      events: [],
      leads: [
        lead({
          id: 'bookmarked',
          signals: [userSignal('bookmarked', new Date('2026-05-18T00:02:00Z'))],
        }),
        lead({
          id: 'normal',
          signals: [userSignal('none', new Date('2026-05-18T00:03:00Z'))],
        }),
        lead({
          id: 'hidden',
          signals: [
            userSignal('bookmarked', new Date('2026-05-18T00:02:00Z')),
            userSignal('hidden', new Date('2026-05-18T00:04:00Z')),
          ],
        }),
      ],
    });

    expect(
      model.organizationGroups.bookmarked.map(({ lead }) => lead.id),
    ).toEqual(['bookmarked']);
    expect(
      model.organizationGroups.prospects.map(({ lead }) => lead.id),
    ).toEqual(['normal']);
    expect(model.organizationGroups.hidden.map(({ lead }) => lead.id)).toEqual([
      'hidden',
    ]);
    expect(model.counts).toMatchObject({
      bookmarked: 1,
      visibleProspects: 1,
      hidden: 1,
    });
  });

  it('uses the discovery rationale as the full stable card summary', () => {
    const presentation = buildLeadPresentation(
      lead({
        status: 'checking',
        rationale:
          'Buyer has direct campaign demand for the seller domain. Keep this second sentence because card summaries are not truncated.',
        content: 'Separate evidence snippet.',
      }),
    );

    expect(presentation.buyerSummary).toBe(
      'Buyer has direct campaign demand for the seller domain. Keep this second sentence because card summaries are not truncated.',
    );
  });
});

describe('getLeadUserSignalState', () => {
  it('returns the newest user organization signal by updatedAt', () => {
    expect(
      getLeadUserSignalState(
        lead({
          signals: [
            userSignal('hidden', new Date('2026-05-18T00:02:00Z')),
            userSignal('bookmarked', new Date('2026-05-18T00:04:00Z')),
            userSignal('none', new Date('2026-05-18T00:03:00Z')),
          ],
        }),
      ),
    ).toBe('bookmarked');
  });
});

describe('canPrepareLeadgenOutreach', () => {
  it('allows checking leads while the run is still active', () => {
    expect(
      canPrepareLeadgenOutreach({
        lead: lead({ status: 'checking' }),
        runStatus: 'RUNNING',
      }),
    ).toBe(true);
  });

  it.each([
    'SUCCEEDED',
    'FAILED',
    'CANCELED',
  ] as const)('allows leftover checking leads after the run reaches %s', (runStatus) => {
    expect(
      canPrepareLeadgenOutreach({
        lead: lead({ status: 'checking' }),
        runStatus,
      }),
    ).toBe(true);
  });

  it('allows checking leads while the run is queued', () => {
    expect(
      canPrepareLeadgenOutreach({
        lead: lead({ status: 'checking' }),
        runStatus: 'QUEUED',
      }),
    ).toBe(true);
  });

  it('allows suppressed leads to receive manual outreach', () => {
    expect(
      canPrepareLeadgenOutreach({
        lead: lead({ status: 'suppressed' }),
        runStatus: 'SUCCEEDED',
      }),
    ).toBe(true);
  });
});
