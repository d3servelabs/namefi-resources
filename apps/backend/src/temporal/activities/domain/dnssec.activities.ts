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
import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { render } from '@react-email/components';
import React from 'react';
import { sendMail } from '../../../mail/mail-client';
import { DnssecDeferredDsOutcome } from '../../../mail/templates/dnssec-deferred-ds-outcome';
import { privyStorageToPrivyCustomMetadata } from '../../../trpc/types';
import { privyClient } from '../../../trpc/utils';

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

const DEFERRED_DS_EMAIL_BCC = [
  'customer-email-archive@d3serve.xyz',
  'sami@d3serve.xyz',
  'zzn@d3serve.xyz',
];

function subjectForOutcome(
  outcome: DeferredDsOutcome,
  domain: PunycodeDomainName,
): string {
  switch (outcome) {
    case 'success':
      return `[Namefi] DNSSEC is now active for ${domain}`;
    case 'authoritative-timeout':
      return `[Namefi] DNSSEC setup didn't complete for ${domain}`;
    case 'public-dns-timeout':
      return `[Namefi] DNSSEC setup is still propagating for ${domain}`;
    case 'cancelled':
      return `[Namefi] DNSSEC setup cancelled for ${domain}`;
    case 'failed':
      return `[Namefi] We couldn't finish DNSSEC setup for ${domain}`;
  }
}

type RecipientContact = {
  email: string;
  /** Display name; falls back to the email's local-part if Privy has no `fullName`. */
  name: string;
};

/**
 * Look up email + display name for a user. Mirrors `maybeGetUserEmail`'s
 * privy-walk but additionally pulls `customMetadata.fullName` so the email
 * greeting can be personalized. Falls back to the email's local-part when
 * Privy has no `fullName` (matches the pattern in
 * `free-claims-correction.activities.ts`). Returns `null` when neither
 * lookup yields an email.
 */
async function maybeGetRecipientContact(
  userId: string,
): Promise<RecipientContact | null> {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) return null;
  const privyUser = await privyClient.getUserById(user.privyUserId);
  if (!privyUser) return null;

  const email =
    privyUser.email?.address ??
    privyUser.linkedAccounts.find((account) => account.type === 'email')
      ?.address;
  if (!email) return null;

  let name = email.split('@')[0] ?? '';
  const parsed = privyStorageToPrivyCustomMetadata.safeParse(
    privyUser.customMetadata,
  );
  if (parsed.success && parsed.data.fullName) {
    name = parsed.data.fullName;
  }
  return { email, name };
}

/**
 * Send the terminal-state notification for a deferred-DS workflow. Renders
 * the `DnssecDeferredDsOutcome` React-Email template — copy is plain
 * language with no DNSKEY/DS jargon, and the CTA links to the domain's DNS
 * settings page. Best-effort; never throws (the dev-team Slack lane is
 * handled separately from the workflow via `generalAlertNamefi`).
 */
export async function sendDeferredDsOutcomeEmailToUser(input: {
  domainName: PunycodeDomainName;
  signingConfig: DnssecKey;
  userId: string;
  outcome: DeferredDsOutcome;
  reason?: string;
}): Promise<void> {
  try {
    // Look up email + display name inside the try so DB/Privy failures honor
    // the "never throws" contract on this activity.
    const contact = await maybeGetRecipientContact(input.userId);
    if (!contact) {
      _logger.warn(
        { userId: input.userId, domainName: input.domainName },
        'Skipping deferred-DS user email — no address on file',
      );
      return;
    }
    const populatedTemplate = React.createElement(DnssecDeferredDsOutcome, {
      recipientName: contact.name,
      recipientEmail: contact.email,
      // Deferred-DS notifications fire on the user's own custom-NS domain,
      // not a PBN-tenant context — leave the override null so the hook reads
      // whatever the email-tracking HOC provides via context (usually null).
      poweredByNamefiDomain: null,
      domain: input.domainName,
      outcome: input.outcome,
    });
    const html = await render(populatedTemplate, {
      pretty: false,
      plainText: false,
    });
    const plain = await render(populatedTemplate, {
      pretty: false,
      plainText: true,
    });
    await sendMail({
      to: [contact.email],
      bcc: DEFERRED_DS_EMAIL_BCC,
      subject: subjectForOutcome(input.outcome, input.domainName),
      content: { html, plain },
    });
  } catch (error) {
    // Log non-PII identifiers — recipient email stays out of operational logs.
    _logger.warn(
      {
        error,
        userId: input.userId,
        outcome: input.outcome,
        domainName: input.domainName,
      },
      'Failed to send deferred-DS outcome email',
    );
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
