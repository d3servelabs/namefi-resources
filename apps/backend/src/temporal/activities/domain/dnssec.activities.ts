import type { DnssecKey } from '@namefi-astra/registrars/lib/abstract-registrar/data/dnssec';
import type { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import type { ChecksumWalletAddress } from '@namefi-astra/utils';
import {
  checkDelegationSignerAssociationChangeRequest,
  checkDsRecordExists,
  getZoneDnssecSigningConfig,
} from '#lib/domains/dnssec';
import {
  getDefaultNameservers,
  getPropagatedNameservers,
} from '#lib/domains/nameservers';
import { logger } from '#lib/logger';

export interface DisableDnssecInput {
  domainName: PunycodeDomainName;
  userAddress: ChecksumWalletAddress;
}

const _logger = logger.child({
  service: 'DnssecActivities',
});

/**
 * Poll the removal status of the DS record
 * @param input - The input object containing the registrar operation ID and domain name
 * @returns {Promise<OperationStatus>} - The operation status
 */
export async function pollDsRecordRemovalStatus({
  registrarOperationId,
  domainName,
}: {
  registrarOperationId: string;
  domainName: PunycodeDomainName;
}): Promise<OperationStatus> {
  const status = await checkDelegationSignerAssociationChangeRequest({
    registrarOperationId,
    domainName,
  });
  switch (status) {
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      throw new Error('Still IN_PROGRESS');
    default:
      return status;
  }
}
/**
 * Poll the removal status of the DS record
 * @param input - The input object containing the registrar operation ID and domain name
 * @returns {Promise<OperationStatus>} - The operation status
 */
export async function pollDsRecordAssociationStatus({
  registrarOperationId,
  domainName,
}: {
  registrarOperationId: string;
  domainName: PunycodeDomainName;
}): Promise<OperationStatus> {
  const status = await checkDelegationSignerAssociationChangeRequest({
    registrarOperationId,
    domainName,
  });
  switch (status) {
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      throw new Error('Still IN_PROGRESS');
    default:
      return status;
  }
}

/**
 * Poll the removal propagation of the DS record
 * @param domainName - The domain name to poll the removal propagation for
 * @returns {Promise<OperationStatus>} - The operation status
 */
export async function pollDsRecordRemovalPropagation(
  domainName: PunycodeDomainName,
): Promise<OperationStatus> {
  const res = await checkDsRecordExists(domainName);
  if (res) {
    throw new Error('Still IN_PROGRESS');
  }
  return 'SUCCESSFUL';
}

export async function pollDsRecordPropagation(
  domainName: PunycodeDomainName,
  dsRecord: DnssecKey,
): Promise<OperationStatus> {
  // TODO: Check against the DS record
  const res = await checkDsRecordExists(domainName);
  if (!res) {
    throw new Error('Still IN_PROGRESS');
  }
  return 'SUCCESSFUL';
}

export async function pollNamefiDefaultDsRecordPropagation(
  domainName: PunycodeDomainName,
): Promise<OperationStatus> {
  const zoneSigningConfig = await getZoneDnssecSigningConfig(domainName);
  if (!zoneSigningConfig) {
    throw new Error('Zone signing config not found');
  }
  return pollDsRecordPropagation(domainName, zoneSigningConfig);
}

/**
 * Poll the default nameservers for a domain
 * @param domainName - The domain name to poll the default nameservers for
 * @returns {Promise<void>} - The operation status
 */
export async function pollDefaultNsPropagated(domainName: PunycodeDomainName) {
  const foundNameservers = new Set(
    (await getPropagatedNameservers(domainName)) ?? [],
  );
  if (foundNameservers.size === 0) {
    throw new Error(`No nameservers found for domain: ${domainName}`);
  }
  _logger.info(`Nameservers found for domain: ${domainName}`);
  (await getDefaultNameservers()).forEach((ns) => {
    if (!foundNameservers.has(ns)) {
      throw new Error(`Nameserver not found for domain: ${domainName}`);
    }
  });
}
