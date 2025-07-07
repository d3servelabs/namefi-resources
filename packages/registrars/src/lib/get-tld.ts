import { ParseResultType, parseDomain } from 'parse-domain';

import type { PunycodeDomainName } from '#lib/data/validations';
import { toPunycodeDomainName } from '#lib/data/validations';

/**
 * Get the levels of a domain
 * This function is used to get the levels of a domain and the parent domain
 * This is helpful to get around the subTLDs like co.uk, co.za, etc., because you can't just split the domain by the dot.
 *
 * @param normalizedDomainName - The normalized domain name to get the levels of
 * @returns The levels of the domain
 */
export const getTldFromDomainName = (
  domainName: PunycodeDomainName,
): PunycodeDomainName | undefined => {
  const domainParseResult = parseDomain(domainName);
  // Return default values for invalid or unsupported domains
  if (domainParseResult.type !== ParseResultType.Listed) {
    return undefined;
  }

  return toPunycodeDomainName(domainParseResult.topLevelDomains.join('.'));
};
