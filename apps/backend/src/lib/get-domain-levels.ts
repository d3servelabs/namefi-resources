import { ParseResultType, parseDomain } from 'parse-domain';

import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { reverse } from 'ramda';

export type DomainLevels = {
  levels: NamefiNormalizedDomain[];
  parentDomain: NamefiNormalizedDomain | undefined;
};

/**
 * Get the levels of a domain
 * This function is used to get the levels of a domain and the parent domain
 * This is helpful to get around the subTLDs like co.uk, co.za, etc., because you can't just split the domain by the dot.
 *
 * @param normalizedDomainName - The normalized domain name to get the levels of
 * @returns The levels of the domain
 * @deprecated use analyzeDomainName instead
 */
export const getDomainLevels = (
  normalizedDomainName: NamefiNormalizedDomain,
): DomainLevels => {
  const domainParseResult = parseDomain(normalizedDomainName);
  // Return default values for invalid or unsupported domains
  if (domainParseResult.type !== ParseResultType.Listed) {
    return {
      levels: [],
      parentDomain: undefined,
    };
  }

  const publicSuffix = domainParseResult.icann.topLevelDomains.join('.');
  const publicSuffixPlusOne = domainParseResult.icann.domain
    ? `${domainParseResult.icann.domain}.${publicSuffix}`
    : publicSuffix;

  const levels = reverse([
    ...domainParseResult.icann.subDomains,
    ...(domainParseResult.icann.domain ? [domainParseResult.icann.domain] : []),
    publicSuffix,
  ]) as NamefiNormalizedDomain[];

  if (levels.length === 2) {
    return {
      levels,
      parentDomain: publicSuffix as NamefiNormalizedDomain,
    };
  }

  return {
    levels,
    parentDomain: publicSuffixPlusOne as NamefiNormalizedDomain,
  };
};
