import { describe, expect, it } from 'vitest';

import {
  leadgenDomainProfileSchema,
  leadgenOpportunityTriageSchema,
} from './types';

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
});

describe('leadgenOpportunityTriageSchema', () => {
  it('enforces short action-oriented triage output', () => {
    const parsed = leadgenOpportunityTriageSchema.parse({
      domain: 'buyer.com',
      status: 'contact_now',
      score: 86,
      recommendedAction: 'ready_to_contact',
      motion: 'Ready to contact',
      thesis: 'Buyer is a strong exact-name upgrade candidate.',
    });

    expect(parsed.recommendedAction).toBe('ready_to_contact');
    expect(parsed.motion).toBe('Ready to contact');
  });
});
