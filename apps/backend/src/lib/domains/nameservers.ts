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
  const isUsingOtherNameservers = nameservers.some(
    (ns: Nameserver) => !config.NAMEFI_ASTRA_NAMESERVERS.includes(ns),
  );
  return !isUsingOtherNameservers;
};

/**
 * Checks if a domain is using the old Namefi Astra nameservers
 * @param normalizedDomainName - The normalized domain name to check
 * @returns {Promise<boolean>} - True if the domain is using the old Namefi Astra nameservers, false otherwise
 */
export const checkIfUsingOldNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await sldRegistrar.getNameServers(
    toPunycodeDomainName(normalizedDomainName),
  );

  const isUsingOtherNameservers = nameservers.some(
    (ns) =>
      ![
        toPunycodeFqdn('ns1.namefi.io.'),
        toPunycodeFqdn('ns2.namefi.io.'),
      ].includes(ns),
  );
  return !isUsingOtherNameservers;
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
