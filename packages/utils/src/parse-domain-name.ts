import { parseDomain, ParseResultType } from 'parse-domain';
import type { NamefiNormalizedDomain } from './namefi-flavor';

/**
 * The analysis of a domain
 * This is helpful to get around the subTLDs like co.uk, co.za, etc., because you can't just split the domain by the dot.
 * the word "registryType" is used to refer to the entity that manages the domain, not the domain itself.
 * the word "traditional" is used to refer to the domain that is managed by an icann registry.
 * the word "subdomain" is used to refer to the domain that is managed by an independent registry.
 */
export type DomainParseResult =
  | InvalidDomainParseResult
  | ValidDomainParseResult;

export type InvalidDomainParseResult = {
  valid: false;
  reason: 'invalid' | 'reserved' | 'notListed' | 'ip' | 'unknown';
  message: string;
  domain: NamefiNormalizedDomain;
};

export type ValidDomainParseResult = {
  valid: true;
  /**
   * The labels of the domain
   * @example ['www', 'google', 'com']
   */
  labels: string[];
  /**
   * The level of the domain, ie; the number of labels in the domain
   * @example 3
   */
  level: number;
  /**
   * The registry type of the domain, if it's a subdomain (ie; managed by an independent registry) or a traditional domain (ie; managed by an icann registry)
   * @example 'subdomain' | 'traditional'
   */
  registryType: 'subdomain' | 'traditional';
  /**
   * The nearest traditional parent domain.
   * in case of a subdomain, this is the domain that is managed by an icann registry of which the subdomain is a child.
   * in case of a traditional domain, this is the immediate parent domain.
   */
  nearestTraditionalParentDomain: NamefiNormalizedDomain;
  /**
   * The domain name that was analyzed
   */
  domain: NamefiNormalizedDomain;
};

/**
 * Get the levels of a domain
 * This function is used to get the levels of a domain and the parent domain
 * This is helpful to get around the subTLDs like co.uk, co.za, etc., because you can't just split the domain by the dot.
 *
 * @param normalizedDomainName - The normalized domain name to get the levels of
 * @returns The levels of the domain
 */
export const parseDomainName = (
  normalizedDomainName: NamefiNormalizedDomain,
): DomainParseResult => {
  const domainParseResult = parseDomain(normalizedDomainName);
  // Return default values for invalid or unsupported domains
  if (domainParseResult.type !== ParseResultType.Listed) {
    let reason: InvalidDomainParseResult['reason'] = 'unknown';
    let message = 'unknown';
    switch (domainParseResult.type) {
      case ParseResultType.Invalid:
        reason = 'invalid';
        message =
          'This parse result is returned in case the given hostname does not adhere to RFC 1034.';
        break;
      case ParseResultType.Reserved:
        reason = 'reserved';
        message =
          'This parse result is returned when the given hostname is the root domain (the empty string "") or belongs to the top-level domain localhost, local, example, invalid or test';
        break;
      case ParseResultType.NotListed:
        reason = 'notListed';
        message =
          'This parse result is returned when the given hostname is valid and does not belong to a reserved top-level domain, but is not listed in the public suffix list.';
        break;
      case ParseResultType.Ip:
        reason = 'ip';
        message =
          'This parse result is returned if the given hostname was an IPv4 or IPv6.';
        break;
      default:
        reason = 'unknown';
        message =
          'This parse result is returned when the given hostname is not a valid domain name';
        break;
    }
    return {
      valid: false,
      reason,
      message,
      domain: normalizedDomainName,
    };
  }
  const labels = domainParseResult.labels;
  const level = labels.length;

  const registryType =
    domainParseResult.subDomains.length > 0 ? 'subdomain' : 'traditional';

  const nearestTraditionalParentDomain = (
    registryType === 'subdomain'
      ? [domainParseResult.domain, ...domainParseResult.topLevelDomains]
      : domainParseResult.topLevelDomains
  ).join('.') as NamefiNormalizedDomain;

  return {
    valid: true,
    labels,
    level,
    registryType,
    nearestTraditionalParentDomain,
    domain: normalizedDomainName,
  };
};
