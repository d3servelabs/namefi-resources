import { createHash } from 'node:crypto';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const _mockDeterministicRandomAvailability = (
  domainLdh: NamefiNormalizedDomain,
) => {
  // use the domainLdh to generate a deterministic random number
  const hash = createHash('sha256').update(domainLdh).digest('hex');
  const randomNumber = Number.parseInt(hash.slice(0, 8), 16) % 100;
  return randomNumber > 50;
};

const _mockDeterministicRandomOwner = (domain: NamefiNormalizedDomain) => {
  // use the domainLdh to generate a deterministic random owner
  const hash = createHash('sha256').update(domain).digest('hex');
  return hash.slice(0, 8);
};

export const getDomainInfo = async (domains: NamefiNormalizedDomain[]) => {
  // MOCK response. Respond the query term as is, plus 2 variations of it.
  return domains.map((domain: NamefiNormalizedDomain) => ({
    domain,
    availability: _mockDeterministicRandomAvailability(domain),
    priceInUSD: 5, // XXX: always 5 USD for mock
    currentOwner: _mockDeterministicRandomOwner(domain),
    // expiration date will not be supplied for now as we are not creating a concept of expiration date in pilot phase.
  }));
};

// database schema
