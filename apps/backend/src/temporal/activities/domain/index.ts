/** biome-ignore-all lint/performance/noNamespaceImport: expected */
import { db, namefiNftOwnersView } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as DnssecLib from '#lib/domains/dnssec';
import * as NameserversLib from '#lib/domains/nameservers';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import * as DnsActivities from './dns.activities';
import * as DnssecActivities from './dnssec.activities';
import * as RegistrarActivities from './registrar.activities';
import { getDomainDurationConstraints } from '#lib/domains/duration-constraints/index';
import {
  getRenewPriceByDomain,
  sendEmailNotificationForRenewFailedToCharge,
  sendEmailNotificationForRenewResult,
  sendEmailNotificationForUpcomingRenew,
  getDomainsUpForRenewalGroupedByOwner,
} from './renew.activities';

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
  // Renew activities
  getRenewPriceByDomain,
  sendEmailNotificationForRenewFailedToCharge,
  sendEmailNotificationForRenewResult,
  sendEmailNotificationForUpcomingRenew,
  getDomainsUpForRenewalGroupedByOwner,
  getDomainDurationConstraints,
};

export async function getDomainChain(
  normalizedDomainName: NamefiNormalizedDomain,
): Promise<number> {
  const domainResult = await db
    .select()
    .from(namefiNftOwnersView)
    .where(eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName))
    .limit(1);

  const domain = domainResult[0];

  if (!domain) {
    throw new Error(`Domain ${normalizedDomainName} not found`);
  }

  return domain.chainId;
}
