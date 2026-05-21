import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { describe, expect, it } from 'vitest';

import {
  buildLeadPresentation,
  buildLeadPresentationModel,
  type LeadgenLead,
} from './leadgen-presentation';

const sourceDomain = 'example.com' as NamefiNormalizedDomain;

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
  createdAt: new Date('2026-05-18T00:00:00Z'),
  updatedAt: new Date('2026-05-18T00:00:00Z'),
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
