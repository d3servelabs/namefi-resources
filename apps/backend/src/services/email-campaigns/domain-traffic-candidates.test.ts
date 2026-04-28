import { describe, expect, it } from 'vitest';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { aggregateDomainTrafficCandidatesByUser } from './domain-traffic-candidates';

const domain = (value: string) => namefiNormalizedDomainSchema.parse(value);

describe('aggregateDomainTrafficCandidatesByUser', () => {
  it('collapses multiple candidate rows for the same user into one sorted email payload', () => {
    const candidates = aggregateDomainTrafficCandidatesByUser([
      {
        userId: 'user-b',
        domains: [
          { domain: domain('brand-b.com'), weeklyQueries: 2400 },
          { domain: domain('brand-b.io'), weeklyQueries: 1200 },
        ],
      },
      {
        userId: 'user-a',
        domains: [{ domain: domain('brand-a.com'), weeklyQueries: 1800 }],
      },
      {
        userId: 'user-b',
        domains: [
          { domain: domain('brand-b.ai'), weeklyQueries: 3600 },
          { domain: domain('brand-b.com'), weeklyQueries: 2600 },
        ],
      },
    ]);

    expect(candidates).toEqual([
      {
        userId: 'user-a',
        domains: [{ domain: domain('brand-a.com'), weeklyQueries: 1800 }],
      },
      {
        userId: 'user-b',
        domains: [
          { domain: domain('brand-b.ai'), weeklyQueries: 3600 },
          { domain: domain('brand-b.com'), weeklyQueries: 2600 },
          { domain: domain('brand-b.io'), weeklyQueries: 1200 },
        ],
      },
    ]);
  });

  it('limits each user to the configured top traffic domains', () => {
    const candidates = aggregateDomainTrafficCandidatesByUser(
      [
        {
          userId: 'user-a',
          domains: [
            { domain: domain('one.com'), weeklyQueries: 100 },
            { domain: domain('two.com'), weeklyQueries: 200 },
            { domain: domain('three.com'), weeklyQueries: 300 },
          ],
        },
      ],
      { maxDomainsPerUser: 2 },
    );

    expect(candidates[0]?.domains).toEqual([
      { domain: domain('three.com'), weeklyQueries: 300 },
      { domain: domain('two.com'), weeklyQueries: 200 },
    ]);
  });
});
