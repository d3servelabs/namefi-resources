import { parseDomain, ParseResultType } from 'parse-domain';
import type { NamefiNormalizedDomain } from './namefi-flavor';

function safeParseArray(input: string | undefined) {
  if (input === undefined || input === null) {
    return null;
  }
  try {
    const parseRes = JSON.parse(input);
    if (Array.isArray(parseRes)) {
      return parseRes;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function getExtraAllowedPublicSuffix(): string[] {
  // Browser
  if (typeof window === 'object' && !!window) {
    if ('namefi_tlds' in window && Array.isArray(window.namefi_tlds)) {
      return window.namefi_tlds;
    }
  }

  // Node
  if (
    typeof process === 'object' &&
    !!process &&
    'env' in process &&
    typeof process.env === 'object' &&
    !!process.env
  ) {
    if ('NAMEFI_UNOFFICIAL_TLDS' in process.env) {
      const namefiTlds = safeParseArray(process.env.NAMEFI_UNOFFICIAL_TLDS);
      if (namefiTlds) {
        return namefiTlds;
      }
    }
  }

  // Fallback
  return [] as string[];
}

function parseDomainWithUnofficialPublicSuffix(
  normalizedDomainName: NamefiNormalizedDomain,
): { matched: true; result: ValidDomainParseResult } | { matched: false } {
  const publicSuffixes = getExtraAllowedPublicSuffix();
  for (const publicSuffix of publicSuffixes) {
    if (normalizedDomainName.endsWith(`.${publicSuffix}`)) {
      const labels = normalizedDomainName.split('.');
      if (labels.length !== 2) {
        continue;
      }
      return {
        matched: true,
        result: {
          valid: true,
          domain: normalizedDomainName,
          labels,
          registryType: 'subdomain',
          level: labels.length,
          publicSuffix,
          immediateParentDomain: labels
            .slice(1)
            .join('.') as NamefiNormalizedDomain,
          publicSuffixPlusOne: labels.slice(-2).join('.'),
          nearestTraditionalParentDomain: labels
            .slice(1)
            .join('.') as NamefiNormalizedDomain,
        },
      };
    }
  }

  return {
    matched: false,
  };
}
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
   * - in case of a subdomain, this is the domain that is managed by an icann registry of which the subdomain is a child.
   *   - subdomain.domain.com -> domain.com
   *   - subdomain.domain.co.uk -> domain.co.uk
   *   - subsub.subdomain.domain.co.uk -> domain.co.uk
   * - in case of a traditional domain, this is the immediate parent domain.
   *   - domain.com -> com
   *   - domain.co.uk -> co.uk
   *   - domain.co.za -> co.za
   * @deprecated use publicSuffixPlusOne instead
   */
  nearestTraditionalParentDomain: NamefiNormalizedDomain;
  immediateParentDomain: NamefiNormalizedDomain;
  /**
   * The domain name that was analyzed
   */
  domain: NamefiNormalizedDomain;

  /**
   * The public suffix of the domain (ie; the tld or the sld that are considered to be the public suffix (ie; the domain that is managed by an icann registry))
   * @example 'com'
   * @example 'co.uk'
   * @example 'co.za'
   */
  publicSuffix: string;

  /**
   * The public suffix of the domain plus an extra label (ie; the sld/3ld)
   * @example 'example.com'
   * @example 'example.co.uk'
   * @example 'example.co.za'
   */
  publicSuffixPlusOne: string;
};

/**
 * TODO: Account for the case of tld ( since it's parent is '' which is not a valid NamefiNormalizedDomain)
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
  const unofficialParseResult =
    parseDomainWithUnofficialPublicSuffix(normalizedDomainName);
  if (unofficialParseResult.matched) {
    return unofficialParseResult.result;
  }
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
  const immediateParentDomain = labels
    .slice(1)
    .join('.') as NamefiNormalizedDomain;

  const publicSuffix = domainParseResult.topLevelDomains.join('.');
  const publicSuffixPlusOne = [
    domainParseResult.domain,
    ...domainParseResult.topLevelDomains,
  ].join('.');

  return {
    valid: true,
    labels,
    level,
    registryType,
    nearestTraditionalParentDomain,
    immediateParentDomain,
    domain: normalizedDomainName,
    publicSuffix,
    publicSuffixPlusOne,
  };
};
