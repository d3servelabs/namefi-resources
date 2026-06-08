import { describe, expect, it } from 'vitest';

import {
  leadgenDomainProfileSchema,
  leadgenOpportunityTriageModelSchema,
  leadgenOpportunityTriageSchema,
} from './types';

function buildDomainProfileInput(thesisCount: number) {
  return {
    evidenceStandards: [
      'Company naming, category relevance, and upgrade value are required.',
    ],
    searchDirections: [
      {
        recipe: 'domain_weakness_check',
        intent: 'Find companies with weaker current domains.',
      },
    ],
    traits: [],
    theses: Array.from({ length: thesisCount }, (_, index) => ({
      title: `Buyer angle ${index + 1}`,
      confidence: 0.7,
      discoveryRecipes: ['domain_weakness_check'],
      requiredEvidence: ['Company with weak current domain'],
      seedQueries: [`buyer angle ${index + 1} official`],
    })),
    cautions: [],
    seedQueries: ['startup official'],
  };
}

describe('leadgenDomainProfileSchema', () => {
  it('requires opportunity framing fields', () => {
    const parsed = leadgenDomainProfileSchema.parse({
      evidenceStandards: [
        'Company naming, AI category relevance, and upgrade value are required.',
      ],
      searchDirections: [
        {
          recipe: 'domain_weakness_check',
          intent: 'Find AI companies with weaker current domains.',
        },
      ],
      traits: [],
      theses: [
        {
          title: 'AI brand upgrade',
          confidence: 0.8,
          discoveryRecipes: ['domain_weakness_check'],
          requiredEvidence: ['AI company with weak current domain'],
          seedQueries: ['AI company official'],
        },
      ],
      cautions: [],
      seedQueries: ['AI startup official'],
    });

    expect(parsed.evidenceStandards).toHaveLength(1);
    expect(parsed.searchDirections[0]?.recipe).toBe('domain_weakness_check');
  });

  it('allows five buyer theses for high-effort runs', () => {
    const parsed = leadgenDomainProfileSchema.parse(buildDomainProfileInput(5));

    expect(parsed.theses).toHaveLength(5);
  });

  it('rejects more than five buyer theses', () => {
    expect(() =>
      leadgenDomainProfileSchema.parse(buildDomainProfileInput(6)),
    ).toThrow();
  });
});

describe('leadgenOpportunityTriageSchema', () => {
  it('keeps model triage output free of duplicate action and prose fields', () => {
    const parsed = leadgenOpportunityTriageModelSchema.parse({
      domain: 'buyer.com',
      score: 86,
      status: 'contact_now',
    });

    expect(parsed).toEqual({
      domain: 'buyer.com',
      score: 86,
      status: 'contact_now',
    });
  });

  it('enforces short action-oriented triage output', () => {
    const parsed = leadgenOpportunityTriageSchema.parse({
      domain: 'buyer.com',
      status: 'contact_now',
      score: 86,
    });

    expect(parsed.status).toBe('contact_now');
    expect(parsed.score).toBe(86);
  });
});
