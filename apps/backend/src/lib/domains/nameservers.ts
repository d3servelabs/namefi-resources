import { resolveNs } from 'node:dns/promises';
import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import {
  type PunycodeDomainName,
  type PunycodeFqdn,
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { config } from '#lib/env';
import { logger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';

const _logger = logger.child({
  service: 'DomainsDnssecService',
});

/**
 * The result of comparing arrays of nameservers to expected nameservers
 */
export type NameserversComparisonResult = {
  /**
   * True if the nameservers are an exact match, i.e. arrays are the equivalent
   */
  isExactMatch: boolean;
  /**
   * True if the nameservers are a complete mismatch, i.e. no nameservers are in common
   */
  isCompleteMismatch: boolean;
  /**
   * True if the nameservers are using other nameservers along with the expected nameservers
   */
  isUsingOtherNameserversAlongWithExpectedNameservers: boolean;
  /**
   * True if the nameservers are using all the expected nameservers, ie; nameservers array includes all the expected nameservers
   */
  isUsingAllExpectedNameservers: boolean;
  /**
   * The nameservers that are used but not in the expected nameservers
   */
  usedNameserversNotInExpected: Set<Nameserver>;
  /**
   * The nameservers that are not used but are in the expected nameservers
   */
  unusedExpectedNameservers: Set<Nameserver>;
  /**
   * The nameservers that are in both the nameservers and expected nameservers
   * if isExactMatch is true or isUsingAllExpectedNameservers is true, this will be the same as expectedNameservers
   * if isCompleteMismatch is true, this will be an empty set
   */
  intersection: Set<Nameserver>;
  /**
   * The nameservers that are in the nameservers but not in the expected nameservers
   * if isExactMatch is true, this will be an empty set
   * if isCompleteMismatch is true, this will be the same as nameservers
   */
  difference: Set<Nameserver>;
};

/**
 * Compares nameservers to expected nameservers
 * @param nameservers - The nameservers to compare
 * @param expectedNameservers - The expected nameservers
 * @returns {NameserversComparisonResult} - The comparison result
 */
export function compareNameservers(
  nameservers: Nameserver[],
  expectedNameservers: Nameserver[],
) {
  const usedNameserversNotInExpected = new Set(nameservers);
  const unusedExpectedNameservers = new Set(expectedNameservers);

  // Initialize sets for the intersection and difference
  const intersection = new Set<Nameserver>();
  const difference = new Set<Nameserver>();

  // Find the intersection of the nameservers and expected nameservers
  expectedNameservers.forEach((ns) => {
    if (usedNameserversNotInExpected.has(ns)) {
      usedNameserversNotInExpected.delete(ns);
      unusedExpectedNameservers.delete(ns);
      intersection.add(ns);
    } else {
      difference.add(ns);
    }
  });

  usedNameserversNotInExpected.forEach((ns) => {
    difference.add(ns);
  });

  const isUsingAllExpectedNameservers = unusedExpectedNameservers.size === 0;
  const isUsingOtherNameserversAlongWithExpectedNameservers =
    isUsingAllExpectedNameservers && usedNameserversNotInExpected.size > 0;

  const isExactMatch = difference.size === 0;
  const isCompleteMismatch = intersection.size === 0;

  return {
    isExactMatch,
    isCompleteMismatch,
    isUsingOtherNameserversAlongWithExpectedNameservers,
    isUsingAllExpectedNameservers,
    usedNameserversNotInExpected,
    unusedExpectedNameservers,
    intersection,
    difference,
  };
}

/**
 * Checks if a domain is using the Namefi Astra nameservers
 * @param nameservers - The nameservers to check
 * @returns {boolean} - True if the domain is using the Namefi Astra nameservers, false otherwise
 */
export const checkIfNameserversAreNamefiNameservers = (
  nameservers: Nameserver[],
): boolean => {
  const comparisonResult = compareNameservers(
    nameservers,
    config.NAMEFI_ASTRA_NAMESERVERS,
  );
  return comparisonResult.isExactMatch;
};

/**
 * Checks if a domain is using the old Namefi nameservers
 * @param nameservers - The nameservers to check
 * @returns {boolean} - True if the domain is using the old Namefi nameservers, false otherwise
 */
export const checkIfNameserversAreOldNamefiNameservers = (
  nameservers: Nameserver[],
): boolean => {
  const comparisonResult = compareNameservers(nameservers, [
    toPunycodeFqdn('ns1.namefi.io.'),
    toPunycodeFqdn('ns2.namefi.io.'),
  ]);
  return comparisonResult.isExactMatch;
};

/**
 * Checks if a domain is using the Namefi Astra nameservers
 * @param normalizedDomainName - The normalized domain name to check
 * @returns {Promise<boolean>} - True if the domain is using the Namefi Astra nameservers, false otherwise
 */
export const checkIfUsingNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await sldRegistrar.getNameServers(
    toPunycodeDomainName(normalizedDomainName),
  );
  return checkIfNameserversAreNamefiNameservers(nameservers);
  // TODO: if there's an advanced user that wants to use fallback nameservers, we should return comparisonResult.isUsingAllExpectedNameservers
};

/**
 * Checks if a domain is using the old Namefi nameservers
 * @param normalizedDomainName - The normalized domain name to check
 * @returns {Promise<boolean>} - True if the domain is using the old Namefi nameservers, false otherwise
 */
export const checkIfUsingOldNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await sldRegistrar.getNameServers(
    toPunycodeDomainName(normalizedDomainName),
  );

  return checkIfNameserversAreOldNamefiNameservers(nameservers);
};

/**
 * Retrieves current nameservers for a domain
 * @param {string} domain - e.g. "example.com"
 * @returns {Promise<string[]>} - Array of nameservers for the domain
 */
export async function getPropagatedNameservers(
  domain: PunycodeDomainName,
): Promise<PunycodeFqdn[]> {
  try {
    _logger.debug(`Querying NS records for domain "${domain}"...`);

    // Query nameservers directly for the domain
    const foundNameservers = (await resolveNs(domain)).map(toPunycodeFqdn);

    _logger.debug(
      {
        domain,
        foundNameservers,
      },
      `Found ${foundNameservers.length} NS records for "${domain}"`,
    );

    // Format nameservers with trailing dots
    return foundNameservers;
  } catch (error: any) {
    _logger.error(
      `Failed to get nameservers for "${domain}": ${error.message}`,
    );
    throw error;
  }
}

/**
 * Retrieves the default nameservers for Namefi Astra
 * @returns {Nameserver[]} - Array of default nameservers
 */
export function getDefaultNameservers(): Promise<Nameserver[]> {
  return Promise.resolve(config.NAMEFI_ASTRA_NAMESERVERS);
}

/**
 * TODO support 3ld domains
 * Sets the nameservers for a domain
 * @param domainName - The domain name to set the nameservers for
 * @param nameservers - The nameservers to set for the domain
 */
export async function setNameserversForDomain({
  domainName,
  nameservers,
}: { domainName: PunycodeDomainName; nameservers: Nameserver[] }) {
  await sldRegistrar.setNameServers(domainName, nameservers);
}

/**
 * TODO support 3ld domains
 * Retrieves the nameservers for a domain
 * @param domainName - The domain name to get the nameservers for
 * @returns The nameservers for the domain
 */
export async function getNameserversForDomain(domainName: PunycodeDomainName) {
  const registrarNameservers = await sldRegistrar.getNameServers(domainName);
  return registrarNameservers;
}
