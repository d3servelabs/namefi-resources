import { db } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as DnssecLib from '#lib/domains/dnssec';
import * as NameserversLib from '#lib/domains/nameservers';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import * as DnsActivities from './dns.activities';
import * as DnssecActivities from './dnssec.activities';
import * as RegistrarActivities from './registrar.activities';

//TODO: add a check to see if name collision is happening
export const DomainsActivities = {
  parkDomain,
  isDomainParked,
  ...NameserversLib,
  ...DnssecLib,
  ...DnssecActivities,
  ...RegistrarActivities,
  ...DnsActivities,
  getPoweredByNamefi3PDomains,
  getDomainChain,
};

export async function getDomainChain(
  normalizedDomainName: NamefiNormalizedDomain,
): Promise<number> {
  const domain = await db.query.namefiNftTable.findFirst({
    where: (table, { eq }) =>
      eq(table.normalizedDomainName, normalizedDomainName),
  });

  if (!domain) {
    throw new Error(`Domain ${normalizedDomainName} not found`);
  }

  return domain.chainId;
}
