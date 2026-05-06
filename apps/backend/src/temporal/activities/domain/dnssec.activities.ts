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
  validateDsAgainstAuthoritative,
  validateDsAgainstPublicDns,
  type ValidationLaneResult,
} from '#lib/domains/dnssec-validation';
import {
  getDefaultNameservers,
  getPropagatedNameservers,
} from '#lib/domains/nameservers';
import { createLogger } from '#lib/logger';
import { maybeGetUserEmail, sendEmailOrThrow } from '../notify.activities';

export interface DisableDnssecInput {
  domainName: PunycodeDomainName;
  userAddress: ChecksumWalletAddress;
}

const _logger = createLogger({ module: 'dnssec-activities' });

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
 * Poll the user-provided DS against authoritative-NS DNSKEYs. Throws if not
 * matching yet so Temporal's activity retry handles the loop. Returns the
 * lane result on success so downstream steps can read `matchedDnskey`.
 */
export async function pollAuthoritativeDsValidation(input: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
}): Promise<ValidationLaneResult> {
  const result = await validateDsAgainstAuthoritative(input);
  if (!result.isValid) {
    throw new Error(
      `Authoritative validation not matching yet for "${input.domainName}"`,
    );
  }
  return result;
}

/**
 * Poll the user-provided DS against Google DoH-resolved DNSKEYs. Same shape
 * as `pollAuthoritativeDsValidation`.
 */
export async function pollPublicDnsDsValidation(input: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
}): Promise<ValidationLaneResult> {
  const result = await validateDsAgainstPublicDns(input);
  if (!result.isValid) {
    throw new Error(
      `Public DNS validation not matching yet for "${input.domainName}"`,
    );
  }
  return result;
}

export type DeferredDsOutcome =
  | 'success'
  | 'authoritative-timeout'
  | 'public-dns-timeout'
  | 'cancelled'
  | 'failed';

/**
 * Send the terminal-state notification for a deferred-DS workflow. Always
 * tries the user email lane (best-effort) and always returns; the dev-team
 * Slack lane is handled via `generalAlertNamefi` from the workflow itself
 * so this stays focused on the user-facing email.
 */
export async function sendDeferredDsOutcomeEmailToUser(input: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
  userId: string;
  outcome: DeferredDsOutcome;
  reason?: string;
}): Promise<void> {
  const email = await maybeGetUserEmail(input.userId);
  if (!email) {
    _logger.warn(
      { userId: input.userId, domainName: input.domainName },
      'Skipping deferred-DS user email — no address on file',
    );
    return;
  }
  const subject = subjectForOutcome(input.outcome, input.domainName);
  const plain = bodyForOutcome(input);
  try {
    await sendEmailOrThrow({
      to: [email],
      subject,
      content: { plain, html: `<p>${plain}</p>` },
    });
  } catch (error) {
    _logger.warn(
      {
        error,
        to: email,
        outcome: input.outcome,
        domainName: input.domainName,
      },
      'Failed to send deferred-DS outcome email',
    );
  }
}

function subjectForOutcome(
  outcome: DeferredDsOutcome,
  domain: PunycodeDomainName,
): string {
  switch (outcome) {
    case 'success':
      return `DNSSEC delegation signer associated for ${domain}`;
    case 'authoritative-timeout':
      return `DNSSEC DS submission timed out (authoritative validation) for ${domain}`;
    case 'public-dns-timeout':
      return `DNSSEC DS submission timed out (public DNS validation) for ${domain}`;
    case 'cancelled':
      return `DNSSEC DS submission cancelled for ${domain}`;
    case 'failed':
      return `DNSSEC DS submission failed for ${domain}`;
  }
}

function bodyForOutcome(input: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
  outcome: DeferredDsOutcome;
  reason?: string;
}): string {
  const { domainName, signingConfig, outcome, reason } = input;
  const tag = signingConfig.keyTag ?? '—';
  switch (outcome) {
    case 'success':
      return `Your delegation signer (key tag ${tag}) for ${domainName} has been associated at the registrar after the DNSKEY validated at both your authoritative nameservers and public DNS.`;
    case 'authoritative-timeout':
      return `We waited for the DNSKEY at your authoritative nameservers to match the DS you submitted (key tag ${tag}) for ${domainName}, but it never did within the allotted time. No DS was associated. Verify the DNSKEY published at your nameservers, then re-submit from the DNSSEC panel.`;
    case 'public-dns-timeout':
      return `Your authoritative nameservers published the DNSKEY for ${domainName} (key tag ${tag}), but the change did not propagate to public DNS within the allotted time. No DS was associated. Once propagation completes, re-submit from the DNSSEC panel.`;
    case 'cancelled':
      return `The deferred DS submission for ${domainName} (key tag ${tag}) was cancelled. No DS was associated.`;
    case 'failed':
      return `The deferred DS submission for ${domainName} (key tag ${tag}) failed unexpectedly. No DS was associated.${reason ? ` Reason: ${reason}` : ''}`;
  }
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
  _logger.debug(`Nameservers found for domain: ${domainName}`);
  (await getDefaultNameservers()).forEach((ns) => {
    if (!foundNameservers.has(ns)) {
      throw new Error(`Nameserver not found for domain: ${domainName}`);
    }
  });
}
