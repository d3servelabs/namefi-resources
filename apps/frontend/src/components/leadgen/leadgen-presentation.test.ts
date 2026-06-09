import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { describe, expect, it } from 'vitest';

import {
  buildLeadPresentation,
  buildLeadPresentationModel,
  type LeadgenLead,
  type LeadgenSnapshot,
} from './leadgen-presentation';

const sourceDomain = 'example.com' as NamefiNormalizedDomain;
const baseDate = new Date('2026-05-18T00:00:00Z');

const baseLead = {
  id: 'lead-1',
  businessDomain: 'buyer.com',
  rankingState: 'checking',
  initialOutreachCandidate: false,
  organizationState: 'none',
  rationale: 'Initial rationale.',
  content: 'Initial content.',
  contacts: [],
  drafts: [],
} satisfies LeadgenLead;

function lead(overrides: Partial<LeadgenLead>) {
  return {
    ...baseLead,
    ...overrides,
  } satisfies LeadgenLead;
}

function runSnapshot(
  overrides: Partial<LeadgenSnapshot> & { leads?: LeadgenLead[] } = {},
) {
  const leads = overrides.leads ?? [];

  return {
    id: 'run-1',
    domain: sourceDomain,
    status: 'RUNNING',
    reasoningEffort: 'medium',
    startedAt: baseDate,
    finishedAt: null,
    errorMessage: null,
    summary: null,
    leadCount: leads.length,
    contactCount: 0,
    draftCount: 0,
    createdAt: baseDate,
    updatedAt: baseDate,
    intentQueries: [],
    userLeadOrder: [],
    events: [],
    leads,
    ...overrides,
  } satisfies LeadgenSnapshot;
}

describe('buildLeadPresentation', () => {
  it('keeps checking leads separate and puts reviewed leads in the ranked list', () => {
    expect(buildLeadPresentation(baseLead).group).toBe('checking');
    expect(buildLeadPresentation(lead({ rankingState: 'ranked' })).group).toBe(
      'ranked',
    );
  });
});

describe('buildLeadPresentationModel', () => {
  it('uses one count model for ranked and pending prospects', () => {
    const model = buildLeadPresentationModel(
      runSnapshot({
        leads: [
          lead({ id: 'top', rankingState: 'ranked' }),
          lead({ id: 'secondary', rankingState: 'ranked' }),
          lead({ id: 'checking', rankingState: 'checking' }),
          lead({ id: 'suppressed', rankingState: 'ranked' }),
        ],
      }),
    );

    expect(model.counts).toMatchObject({
      prospects: 4,
      ranked: 3,
      checking: 1,
      bookmarked: 0,
      visibleProspects: 4,
      hidden: 0,
    });
  });

  it('groups bookmarked and hidden prospects from derived organization state', () => {
    const model = buildLeadPresentationModel(
      runSnapshot({
        status: 'SUCCEEDED',
        startedAt: baseDate,
        finishedAt: new Date('2026-05-18T00:01:00Z'),
        updatedAt: new Date('2026-05-18T00:01:00Z'),
        leads: [
          lead({
            id: 'bookmarked',
            organizationState: 'bookmarked',
          }),
          lead({
            id: 'normal',
            organizationState: 'none',
          }),
          lead({
            id: 'hidden',
            organizationState: 'hidden',
          }),
        ],
      }),
    );

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

  it('uses optimistic user signal overrides before persisted signals', () => {
    const model = buildLeadPresentationModel(
      runSnapshot({
        status: 'SUCCEEDED',
        startedAt: baseDate,
        finishedAt: new Date('2026-05-18T00:01:00Z'),
        updatedAt: new Date('2026-05-18T00:01:00Z'),
        leads: [
          lead({
            id: 'optimistic',
            organizationState: 'bookmarked',
          }),
        ],
      }),
      {
        userSignalStateByLeadId: {
          optimistic: 'hidden',
        },
      },
    );

    expect(model.organizationGroups.bookmarked).toEqual([]);
    expect(model.organizationGroups.prospects).toEqual([]);
    expect(model.organizationGroups.hidden.map(({ lead }) => lead.id)).toEqual([
      'optimistic',
    ]);
    expect(model.counts).toMatchObject({
      bookmarked: 0,
      visibleProspects: 0,
      hidden: 1,
    });
  });

  it('applies user order while keeping new agent-ranked leads visible', () => {
    const model = buildLeadPresentationModel(
      runSnapshot({
        leads: [
          lead({ id: 'agent-top', businessDomain: 'top.example' }),
          lead({ id: 'agent-middle', businessDomain: 'middle.example' }),
          lead({ id: 'new-agent-lead', businessDomain: 'new.example' }),
        ],
      }),
      {
        userOrderLeadIds: ['agent-middle', 'missing-lead', 'agent-top'],
      },
    );

    expect(model.leads.map(({ lead }) => lead.id)).toEqual([
      'agent-middle',
      'agent-top',
      'new-agent-lead',
    ]);
  });

  it('uses the discovery rationale as the full stable card summary', () => {
    const presentation = buildLeadPresentation(
      lead({
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
