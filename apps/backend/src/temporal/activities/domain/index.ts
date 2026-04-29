/** biome-ignore-all lint/performance/noNamespaceImport: expected */
import { db, namefiNftOwnersCte, namefiNftOwnersView } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import * as DnssecLib from '#lib/domains/dnssec';
import * as NameserversLib from '#lib/domains/nameservers';
import {
  getNonUserSpecificDomainPreferencesAndConfig,
  updateDomainPreferencesAndConfig,
  type UpdateDomainPreferencesAndConfig,
} from '#lib/domains/domain-preferences';
import {
  gaEventParkingFinished,
  gaEventDnsRecordsPropagated,
} from '../../../lib/tracking/checkout';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { isDomainParked, parkDomain } from '#services/dns/parking';
import * as DnsActivities from './dns.activities';
import * as ParkingActivities from './parking-tracking.activities';
import * as DnssecActivities from './dnssec.activities';
import * as RegistrarActivities from './registrar.activities';
import { getDomainDurationConstraints } from '#lib/domains/duration-constraints/index';
import {
  getRenewPriceByDomainInUsd,
  sendEmailNotificationForRenewFailedToCharge,
  sendEmailNotificationForRenewResult,
  sendEmailNotificationForUpcomingRenew,
  getDomainsUpForRenewalGroupedByOwner,
} from './renew.activities';
import * as DisableAutoRenewalActivities from './disable-auto-renewal.activities';
import * as AutoRenewReportActivities from './autorenew-report.activities';
import * as AutoRenewReportAttachmentActivities from './autorenew-report-attachments.activities';
import * as ExportExpirationReportActivities from './export-expiration-report.activities';
import * as ExportTrackingActivities from './export-tracking.activities';
import * as BulkBurnActivities from './bulk-burn.activities';

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
  getRenewPriceByDomainInUsd,
  sendEmailNotificationForRenewFailedToCharge,
  sendEmailNotificationForRenewResult,
  sendEmailNotificationForUpcomingRenew,
  getDomainsUpForRenewalGroupedByOwner,
  getDomainDurationConstraints,
  // Auto-renewal disabling activities
  ...DisableAutoRenewalActivities,
  ...AutoRenewReportActivities,
  ...AutoRenewReportAttachmentActivities,
  // Export/expiration reporting activities
  ...ExportExpirationReportActivities,
  // Export tracking activities
  ...ExportTrackingActivities,
  // Bulk burn activities
  ...BulkBurnActivities,
  ...ParkingActivities,
  updateDomainPreferencesAndConfig,
  getNonUserSpecificDomainPreferencesAndConfig,
  fillDefaultDomainConfig,
  gaEventDnsRecordsPropagated,
  gaEventParkingFinished,
};

export async function getDomainChain(
  normalizedDomainName: NamefiNormalizedDomain,
): Promise<number> {
  const domainResult = await db
    .with(namefiNftOwnersCte)
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

export async function fillDefaultDomainConfig(
  normalizedDomainName: NamefiNormalizedDomain,
  userId: string,
  overrides: UpdateDomainPreferencesAndConfig = {},
) {
  return updateDomainPreferencesAndConfig(normalizedDomainName, userId, {
    /**
     * autoEns flag value should be either user or wallet specific.
     * Because user might transfer it to another wallet(his own or another user), and the reciever may not want autoEns for that wallet.
     */
    autoEnsEnabled: true,
    autoParkEnabled: true,
    autoRenewEnabled: true,
    dnssecEnabled: false,
    ...overrides,
  });
}
