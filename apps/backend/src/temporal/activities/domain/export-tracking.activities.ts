import { Context } from '@temporalio/activity';
import { differenceInHours, format } from 'date-fns';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { EppStatuses } from '@namefi-astra/utils';
import type { Json } from 'drizzle-zod';
import { db, namefiNftCte } from '@namefi-astra/db';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getAllowedChainsForNft } from '#lib/env/allowed-chains';
import {
  domainExportTrackingTable,
  namefiNftView,
  indexedDomainsTable,
} from '@namefi-astra/db';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { RDAP } from '@namefi-astra/registrars/lib/rdap-whois/rdap_client';
import { WhoisClient } from '@namefi-astra/registrars/lib/rdap-whois/whois_client';
import type { PendingTransferInfo } from '@namefi-astra/registrars/lib/abstract-registrar/data/transfer-status';
import { sendMail } from '../../../mail/mail-client';
import { render } from '@react-email/components';
import React from 'react';
import {
  DomainExportPending,
  type DomainExportPendingProps,
} from '../../../mail/templates/domain-export-pending';
import {
  DomainExportComplete,
  type DomainExportCompleteProps,
} from '../../../mail/templates/domain-export-complete';
import { maybeGetUserEmail } from '../notify.activities';
import { privyClient } from '../../../trpc/utils';

const _SEND_TO_SLACK_DIRECT = false;
const ENABLE_EXPORT_EMAILS = false;
/** Minimum hours domain must be confirmed out of account before time-based burn */
const MIN_HOURS_FOR_TIME_BASED_BURN = 36;

/** Email archive addresses for BCC */
const EMAIL_BCC = [
  'customer-email-archive@d3serve.xyz',
  'sami@d3serve.xyz',
  'zzn@d3serve.xyz',
];

const logger = createLogger({ name: 'export-tracking' });

interface StatusHistoryEntry {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
}

type DomainExportTrackingStatus =
  | 'NO_SIGNAL'
  | 'UNDETERMINED'
  | 'PENDING_TRANSFER'
  | 'TRANSFER_PERIOD'
  | 'TRANSFER_COMPLETED'
  | 'TRANSFER_FAILED'
  | 'NEEDS_ADMIN_REVIEW'
  | 'NOTIFIED'
  | 'RESOLVED';

type TransferDecisionAction =
  | 'PENDING_TRANSFER'
  | 'TRANSFER_PERIOD'
  | 'TRANSFER_COMPLETED'
  | 'NO_SIGNAL'
  | 'UNDETERMINED';

interface RawExportTrackingEvidence {
  accountCheck: {
    inOurAccount: boolean;
    registrarKey?: string;
    confirmed: boolean;
  };
  transferStatus: {
    eppStatuses?: string[];
    whoisData?: unknown;
    hasPendingTransfer: boolean;
    hasTransferPeriod: boolean;
    undetermined: boolean;
    source: 'RDAP' | 'WHOIS' | 'NONE';
  };
  directPendingTransfer: {
    pendingTransfer: PendingTransferInfo | null;
    undetermined: boolean;
  };
  indexRegistrarKey: string | null;
}

interface NormalizedExportTrackingEvidence {
  inOurAccount: boolean;
  confirmedInOurAccount: boolean;
  registrarKey?: string;
  eppStatuses?: string[];
  whoisData?: unknown;
  hasPendingTransfer: boolean;
  hasTransferPeriod: boolean;
  undetermined: boolean;
  evidenceSource: 'DIRECT_REGISTRAR' | 'RDAP' | 'WHOIS' | 'NONE';
}

const ACTIVE_PENDING_TRANSFER_STATUSES = new Set<PendingTransferInfo['status']>(
  ['pending', 'clientApproved', 'serverApproved'],
);

function detectTransferSignals(statuses: readonly string[] | undefined): {
  eppStatuses?: string[];
  hasPendingTransfer: boolean;
  hasTransferPeriod: boolean;
} {
  if (!statuses || statuses.length === 0) {
    return {
      eppStatuses: undefined,
      hasPendingTransfer: false,
      hasTransferPeriod: false,
    };
  }

  const normalizedStatuses = EppStatuses.fromArray(statuses);
  return {
    eppStatuses: normalizedStatuses.getEppStatuses(),
    hasPendingTransfer: normalizedStatuses.hasStatus('pendingTransfer'),
    hasTransferPeriod: normalizedStatuses.hasStatus('transferPeriod'),
  };
}

function extractWhoisStatuses(whoisData: unknown): string[] {
  if (!whoisData || typeof whoisData !== 'object') {
    return [];
  }

  const domainRecord = (whoisData as { domain?: { status?: unknown } }).domain;
  if (!domainRecord || typeof domainRecord !== 'object') {
    return [];
  }

  const statuses = domainRecord.status;
  if (!Array.isArray(statuses)) {
    return [];
  }

  return statuses.filter(
    (status): status is string => typeof status === 'string',
  );
}

async function queryDirectPendingTransfer(
  domain: NamefiNormalizedDomain,
): Promise<{
  pendingTransfer: PendingTransferInfo | null;
  undetermined: boolean;
}> {
  try {
    const pendingTransfer = await sldRegistrar.queryPendingTransfer(
      toPunycodeDomainName(domain),
    );
    return {
      pendingTransfer,
      undetermined: false,
    };
  } catch (error) {
    logger.warn(
      { domain, error },
      'Direct registrar pending-transfer lookup failed',
    );
    return {
      pendingTransfer: null,
      undetermined: true,
    };
  }
}

export interface DomainTransferStatus {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
  isLocked: boolean;
  eppStatuses?: string[];
  whoisData?: unknown;
  registrarKey?: string;
  inOurAccount: boolean;
  hasPendingTransfer: boolean;
  hasTransferPeriod: boolean;
}

/**
 * Check EPP/RDAP/WHOIS status for a domain with fallback
 * Priority: RDAP -> WHOIS
 */
export async function checkDomainTransferStatus(
  domain: NamefiNormalizedDomain,
): Promise<{
  eppStatuses?: string[];
  whoisData?: unknown;
  hasPendingTransfer: boolean;
  hasTransferPeriod: boolean;
  undetermined: boolean;
  source: 'RDAP' | 'WHOIS' | 'NONE';
}> {
  const activityContext = Context.current();
  logger.debug({ domain }, 'Checking domain transfer status');

  activityContext.heartbeat({ domain, step: 'rdap_lookup' });

  const punyDomain = toPunycodeDomainName(domain);
  let eppStatuses: string[] | undefined;
  let whoisData: unknown;
  let hasPendingTransfer = false;
  let hasTransferPeriod = false;
  let undetermined = false;
  let source: 'RDAP' | 'WHOIS' | 'NONE' = 'NONE';

  // Try RDAP first
  try {
    const rdapClient = RDAP;
    const rdapData = await rdapClient.queryDomain(punyDomain);

    const rdapSignals = detectTransferSignals(rdapData?.status);
    eppStatuses = rdapSignals.eppStatuses;
    hasPendingTransfer = rdapSignals.hasPendingTransfer;
    hasTransferPeriod = rdapSignals.hasTransferPeriod;

    whoisData = rdapData;
    source = 'RDAP';
    logger.debug(
      { domain, eppStatuses, hasPendingTransfer, hasTransferPeriod },
      'RDAP lookup successful',
    );
  } catch (rdapError) {
    logger.warn(
      { domain, rdapError },
      'RDAP lookup failed, falling back to WHOIS',
    );

    activityContext.heartbeat({ domain, step: 'whois_lookup' });

    // Fallback to WHOIS
    try {
      const whoisClient = WhoisClient;
      const whoisResult = await whoisClient.queryDomain(punyDomain);
      whoisData = whoisResult;

      const whoisStatuses = extractWhoisStatuses(whoisResult);
      const whoisSignals = detectTransferSignals(whoisStatuses);
      eppStatuses = whoisSignals.eppStatuses;
      hasPendingTransfer = whoisSignals.hasPendingTransfer;
      hasTransferPeriod = whoisSignals.hasTransferPeriod;

      if (!hasPendingTransfer && !hasTransferPeriod) {
        const whoisText = JSON.stringify(whoisResult).toLowerCase();
        hasPendingTransfer =
          whoisText.includes('pending transfer') ||
          whoisText.includes('pendingtransfer');
        hasTransferPeriod =
          whoisText.includes('transfer period') ||
          whoisText.includes('transferperiod');
      }

      source = 'WHOIS';

      logger.debug(
        { domain, hasPendingTransfer, hasTransferPeriod },
        'WHOIS lookup successful',
      );
    } catch (whoisError) {
      logger.error(
        { domain, rdapError, whoisError },
        'Both RDAP and WHOIS lookups failed',
      );
      undetermined = true;
    }
  }

  if (source === 'NONE') {
    undetermined = true;
  }

  return {
    eppStatuses,
    whoisData,
    hasPendingTransfer,
    hasTransferPeriod,
    undetermined,
    source,
  };
}

export async function gatherEvidenceForDomain(input: {
  domain: NamefiNormalizedDomain;
}): Promise<RawExportTrackingEvidence> {
  const { domain } = input;

  const [
    accountCheck,
    transferStatus,
    directPendingTransfer,
    indexRegistrarKey,
  ] = await Promise.all([
    isDomainInOurAccount(domain),
    checkDomainTransferStatus(domain),
    queryDirectPendingTransfer(domain),
    getDomainRegistrarFromIndex(domain),
  ]);

  return {
    accountCheck,
    transferStatus,
    directPendingTransfer,
    indexRegistrarKey,
  };
}

export function normalizeEvidence(
  evidence: RawExportTrackingEvidence,
): NormalizedExportTrackingEvidence {
  const {
    accountCheck,
    transferStatus,
    directPendingTransfer,
    indexRegistrarKey,
  } = evidence;

  const directPendingStatus = directPendingTransfer.pendingTransfer?.status;
  const hasDirectPendingTransfer =
    directPendingStatus !== undefined &&
    ACTIVE_PENDING_TRANSFER_STATUSES.has(directPendingStatus);

  let evidenceSource: NormalizedExportTrackingEvidence['evidenceSource'] =
    'NONE';
  if (hasDirectPendingTransfer) {
    evidenceSource = 'DIRECT_REGISTRAR';
  } else if (transferStatus.source === 'RDAP') {
    evidenceSource = 'RDAP';
  } else if (transferStatus.source === 'WHOIS') {
    evidenceSource = 'WHOIS';
  }

  return {
    inOurAccount: accountCheck.inOurAccount,
    confirmedInOurAccount: accountCheck.confirmed,
    registrarKey: accountCheck.registrarKey || indexRegistrarKey || undefined,
    eppStatuses: transferStatus.eppStatuses,
    whoisData: transferStatus.whoisData,
    hasPendingTransfer:
      transferStatus.hasPendingTransfer || hasDirectPendingTransfer,
    hasTransferPeriod: transferStatus.hasTransferPeriod,
    undetermined:
      !accountCheck.confirmed ||
      transferStatus.undetermined ||
      directPendingTransfer.undetermined,
    evidenceSource,
  };
}

export function decideExportTrackingState(
  normalizedEvidence: NormalizedExportTrackingEvidence,
): {
  action: TransferDecisionAction;
  reason: string;
} {
  if (normalizedEvidence.undetermined) {
    return {
      action: 'UNDETERMINED',
      reason: 'Evidence is ambiguous or unavailable',
    };
  }

  if (normalizedEvidence.hasPendingTransfer) {
    return {
      action: 'PENDING_TRANSFER',
      reason: 'Explicit pending-transfer signal detected',
    };
  }

  if (normalizedEvidence.hasTransferPeriod) {
    return {
      action: 'TRANSFER_PERIOD',
      reason: 'Transfer-period signal detected',
    };
  }

  if (!normalizedEvidence.inOurAccount) {
    return {
      action: 'TRANSFER_COMPLETED',
      reason: 'Domain is confirmed outside our registrar account',
    };
  }

  return {
    action: 'NO_SIGNAL',
    reason: 'No explicit transfer signal found',
  };
}

function mapDecisionToPersistedStatus(
  action: TransferDecisionAction,
): DomainExportTrackingStatus | null {
  if (action === 'TRANSFER_COMPLETED') {
    return 'NEEDS_ADMIN_REVIEW';
  }

  return actionToTrackingStatus(action);
}

function actionToTrackingStatus(
  action: TransferDecisionAction,
): DomainExportTrackingStatus | null {
  switch (action) {
    case 'NO_SIGNAL':
      return 'NO_SIGNAL';
    case 'UNDETERMINED':
      return 'UNDETERMINED';
    case 'PENDING_TRANSFER':
      return 'PENDING_TRANSFER';
    case 'TRANSFER_PERIOD':
      return 'TRANSFER_PERIOD';
    case 'TRANSFER_COMPLETED':
      return 'TRANSFER_COMPLETED';
    default:
      return null;
  }
}

/**
 * Check if a domain is still in our registrar account
 */
export async function isDomainInOurAccount(
  domain: NamefiNormalizedDomain,
): Promise<{
  inOurAccount: boolean;
  registrarKey?: string;
  confirmed: boolean;
}> {
  const activityContext = Context.current();
  logger.debug({ domain }, 'Checking if domain is in our account');

  activityContext.heartbeat({ domain, step: 'checking_registrar' });

  try {
    const punyDomain = toPunycodeDomainName(domain);
    const domainDetails = await sldRegistrar.getDomainDetails(punyDomain);

    if (!domainDetails) {
      logger.debug({ domain }, 'Domain not found in our account');
      return { inOurAccount: false, confirmed: true };
    }

    // If we can get domain details, it's in our account
    const registrarKey = domainDetails.registrarKey || undefined;

    logger.debug({ domain, registrarKey }, 'Domain found in our account');
    return { inOurAccount: true, registrarKey, confirmed: true };
  } catch (error) {
    logger.warn({ domain, error }, 'Error checking domain in account');
    // If we get an error, assume it's not in our account
    return { inOurAccount: false, confirmed: false };
  }
}

/**
 * Get unnotified domain export status changes
 */
export async function getUnnotifiedExportStatusChanges(): Promise<
  Array<{
    id: string;
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
    status: string;
    previousStatus: string | null;
    statusChangedAt: Date;
  }>
> {
  logger.debug('Getting unnotified export status changes');

  const unnotified = await db
    .select({
      id: domainExportTrackingTable.id,
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      ownerAddress: domainExportTrackingTable.ownerAddress,
      status: domainExportTrackingTable.status,
      previousStatus: domainExportTrackingTable.previousStatus,
      statusChangedAt: domainExportTrackingTable.statusChangedAt,
    })
    .from(domainExportTrackingTable)
    .where(eq(domainExportTrackingTable.userNotified, false));

  logger.debug({ count: unnotified.length }, 'Found unnotified status changes');

  return unnotified;
}

/**
 * Mark export tracking records as notified
 */
export async function markExportTrackingAsNotified(
  recordIds: string[],
): Promise<void> {
  if (recordIds.length === 0) {
    return;
  }

  logger.debug(
    { count: recordIds.length },
    'Marking export tracking records as notified',
  );

  await db
    .update(domainExportTrackingTable)
    .set({
      userNotified: true,
      notifiedAt: new Date(),
    })
    .where(inArray(domainExportTrackingTable.id, recordIds));

  logger.debug({ count: recordIds.length }, 'Marked records as notified');
}
/**
 * Get all locked NFTs that need export tracking
 * Filters by ALLOWED_CHAINS config to only track NFTs on chains relevant to the current environment
 */
export async function getLockedNftsForTracking(): Promise<
  Array<{
    chainId: number;
    normalizedDomainName: NamefiNormalizedDomain;
    ownerAddress: string;
  }>
> {
  const allowedChains = getAllowedChainsForNft();
  logger.debug(
    { allowedChains },
    'Getting locked NFTs for export tracking on allowed chains',
  );

  const lockedNfts = await db
    .with(namefiNftCte)
    .select({
      chainId: namefiNftView.chainId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      ownerAddress: namefiNftView.ownerAddress,
    })
    .from(namefiNftView)
    .where(
      and(
        eq(namefiNftView.isLocked, true),
        inArray(namefiNftView.chainId, allowedChains),
      ),
    );

  logger.debug({ count: lockedNfts.length }, 'Found locked NFTs');

  return lockedNfts;
}

/**
 * Get existing tracking record for a domain
 */
export async function getExistingTrackingRecord(
  domain: NamefiNormalizedDomain,
  chainId: number,
): Promise<{
  id: string;
  status: string;
  statusHistory: unknown;
  registrarKey?: string | null;
} | null> {
  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      status: domainExportTrackingTable.status,
      statusHistory: domainExportTrackingTable.statusHistory,
      registrarKey: domainExportTrackingTable.registrarKey,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        eq(domainExportTrackingTable.normalizedDomainName, domain),
        eq(domainExportTrackingTable.chainId, chainId),
      ),
    )
    .limit(1);

  return records[0] || null;
}

/**
 * Get domain registrar key from index
 */
export async function getDomainRegistrarFromIndex(
  domain: NamefiNormalizedDomain,
): Promise<string | null> {
  const entries = await db
    .select({
      registrarKey: indexedDomainsTable.registrarKey,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.normalizedDomainName, domain))
    .limit(1);

  return entries[0]?.registrarKey || null;
}

/**
 * Process a single domain for export tracking
 */
export async function processSingleDomainExportStatus(input: {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
}): Promise<{
  action:
    | 'created'
    | 'updated'
    | 'no_change'
    | 'skipped'
    | 'no_signal'
    | 'undetermined';
  status?: string;
  previousStatus?: string;
  domain?: NamefiNormalizedDomain;
  chainId?: number;
  ownerAddress?: string;
  registrarKey?: string | null;
}> {
  const { domain, chainId, ownerAddress } = input;
  const activityContext = Context.current();

  logger.debug({ domain, chainId }, 'Processing single domain export status');
  activityContext.heartbeat({ domain, step: 'checking_status' });

  const rawEvidence = await gatherEvidenceForDomain({ domain });
  const normalizedEvidence = normalizeEvidence(rawEvidence);
  const decision = decideExportTrackingState(normalizedEvidence);

  const currentStatus = mapDecisionToPersistedStatus(decision.action);
  if (!currentStatus) {
    logger.debug(
      { domain, decision },
      'Unable to map decision to tracking status',
    );
    return { action: 'skipped' };
  }

  const registrarKey = normalizedEvidence.registrarKey;

  const existingRecord = await getExistingTrackingRecord(domain, chainId);
  let recordAction: 'created' | 'updated' | 'no_change';
  let previousStatus: string | undefined;

  if (existingRecord) {
    if (existingRecord.status !== currentStatus) {
      const statusHistory =
        (existingRecord.statusHistory as unknown as StatusHistoryEntry[]) || [];
      const newHistoryEntry: StatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: currentStatus,
        eppStatuses: normalizedEvidence.eppStatuses,
      };
      const updatedHistory = [...statusHistory, newHistoryEntry];

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: existingRecord.status as DomainExportTrackingStatus,
          status: currentStatus,
          statusHistory: updatedHistory,
          eppStatuses: normalizedEvidence.eppStatuses,
          whoisData: normalizedEvidence.whoisData as Json,
          registrarKey,
          statusChangedAt: new Date(),
          lastCheckedAt: new Date(),
          transferCompletedAt:
            currentStatus === 'NEEDS_ADMIN_REVIEW' ? new Date() : undefined,
          userNotified: false,
        })
        .where(eq(domainExportTrackingTable.id, existingRecord.id));

      recordAction = 'updated';
      previousStatus = existingRecord.status;

      logger.debug(
        {
          domain,
          previousStatus: existingRecord.status,
          newStatus: currentStatus,
        },
        'Updated domain export tracking status',
      );
    } else {
      await db
        .update(domainExportTrackingTable)
        .set({
          lastCheckedAt: new Date(),
          eppStatuses: normalizedEvidence.eppStatuses,
          whoisData: normalizedEvidence.whoisData as Json,
        })
        .where(eq(domainExportTrackingTable.id, existingRecord.id));

      recordAction = 'no_change';
    }
  } else {
    const initialHistory: StatusHistoryEntry[] = [
      {
        timestamp: new Date().toISOString(),
        status: currentStatus,
        eppStatuses: normalizedEvidence.eppStatuses,
      },
    ];

    await db.insert(domainExportTrackingTable).values({
      normalizedDomainName: domain,
      chainId,
      ownerAddress,
      status: currentStatus,
      statusHistory: initialHistory,
      eppStatuses: normalizedEvidence.eppStatuses,
      whoisData: normalizedEvidence.whoisData as Json,
      registrarKey,
    });

    logger.debug(
      { domain, status: currentStatus },
      'Created new export tracking record',
    );

    recordAction = 'created';
  }

  if (decision.action === 'NO_SIGNAL') {
    return {
      action: 'no_signal',
      status: currentStatus,
      previousStatus,
    };
  }

  if (decision.action === 'UNDETERMINED') {
    return {
      action: 'undetermined',
      status: currentStatus,
      previousStatus,
    };
  }

  if (recordAction === 'updated') {
    return {
      action: 'updated',
      status: currentStatus,
      previousStatus,
    };
  }

  if (recordAction === 'no_change') {
    return { action: 'no_change', status: currentStatus };
  }

  return {
    action: 'created',
    status: currentStatus,
    domain,
    chainId,
    ownerAddress,
    registrarKey,
  };
}

/**
 * Get all domains that should be monitored for transfer progression.
 */
export async function getPendingTransferDomains(): Promise<
  Array<{
    id: string;
    domain: NamefiNormalizedDomain;
    chainId: number;
    status: string;
    statusHistory: unknown;
  }>
> {
  logger.debug('Getting pending transfer domains');

  const transferWatchStatuses: DomainExportTrackingStatus[] = [
    'PENDING_TRANSFER',
    'TRANSFER_PERIOD',
  ];

  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      status: domainExportTrackingTable.status,
      statusHistory: domainExportTrackingTable.statusHistory,
    })
    .from(domainExportTrackingTable)
    .where(inArray(domainExportTrackingTable.status, transferWatchStatuses));

  logger.debug({ count: records.length }, 'Found pending transfer domains');

  return records;
}

/**
 * Check a single pending transfer for completion or failure
 */
export async function checkSinglePendingTransfer(input: {
  id: string;
  domain: NamefiNormalizedDomain;
  chainId: number;
  currentStatus: string;
  statusHistory: unknown;
}): Promise<{
  action: 'failed' | 'completed' | 'still_pending' | 'undetermined';
  newStatus?: string;
  domain?: NamefiNormalizedDomain;
  chainId?: number;
}> {
  const { id, domain, chainId, currentStatus, statusHistory } = input;
  const activityContext = Context.current();

  logger.debug({ domain, id }, 'Checking pending transfer');
  activityContext.heartbeat({ domain, step: 'checking_failure' });

  const rawEvidence = await gatherEvidenceForDomain({ domain });
  const normalizedEvidence = normalizeEvidence(rawEvidence);
  const decision = decideExportTrackingState(normalizedEvidence);

  if (decision.action === 'UNDETERMINED') {
    logger.debug({ domain, decision }, 'checkSinglePendingTransfer');
    return {
      action: 'undetermined',
    };
  }

  if (
    decision.action === 'PENDING_TRANSFER' ||
    decision.action === 'TRANSFER_PERIOD'
  ) {
    const statusFromDecision = actionToTrackingStatus(decision.action);

    if (statusFromDecision && statusFromDecision !== currentStatus) {
      const history = (statusHistory as unknown as StatusHistoryEntry[]) || [];
      const newHistoryEntry: StatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: statusFromDecision,
        eppStatuses: normalizedEvidence.eppStatuses,
      };
      const updatedHistory = [...history, newHistoryEntry];

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: currentStatus as DomainExportTrackingStatus,
          status: statusFromDecision,
          statusHistory: updatedHistory,
          eppStatuses: normalizedEvidence.eppStatuses,
          whoisData: normalizedEvidence.whoisData as Json,
          statusChangedAt: new Date(),
          lastCheckedAt: new Date(),
          transferCompletedAt:
            statusFromDecision === 'TRANSFER_COMPLETED'
              ? new Date()
              : undefined,
          userNotified: false,
        })
        .where(eq(domainExportTrackingTable.id, id));

      logger.debug(
        { domain, statusFromDecision },
        'Updated transfer-watch status based on latest evidence',
      );
    }

    await db
      .update(domainExportTrackingTable)
      .set({
        lastCheckedAt: new Date(),
        eppStatuses: normalizedEvidence.eppStatuses,
        whoisData: normalizedEvidence.whoisData as Json,
      })
      .where(eq(domainExportTrackingTable.id, id));

    return {
      action: 'still_pending',
      newStatus: statusFromDecision ?? undefined,
    };
  }

  if (decision.action === 'NO_SIGNAL' && normalizedEvidence.inOurAccount) {
    const history = (statusHistory as unknown as StatusHistoryEntry[]) || [];
    const newHistoryEntry: StatusHistoryEntry = {
      timestamp: new Date().toISOString(),
      status: 'TRANSFER_FAILED',
      eppStatuses: normalizedEvidence.eppStatuses,
    };
    const updatedHistory = [...history, newHistoryEntry];

    await db
      .update(domainExportTrackingTable)
      .set({
        previousStatus: currentStatus as DomainExportTrackingStatus,
        status: 'TRANSFER_FAILED',
        statusHistory: updatedHistory,
        eppStatuses: normalizedEvidence.eppStatuses,
        whoisData: normalizedEvidence.whoisData as Json,
        statusChangedAt: new Date(),
        lastCheckedAt: new Date(),
        userNotified: false,
      })
      .where(eq(domainExportTrackingTable.id, id));

    logger.debug({ domain }, 'Transfer failed - domain back in our account');
    return { action: 'failed', newStatus: 'TRANSFER_FAILED' };
  }

  const history = (statusHistory as unknown as StatusHistoryEntry[]) || [];
  const newHistoryEntry: StatusHistoryEntry = {
    timestamp: new Date().toISOString(),
    status: 'NEEDS_ADMIN_REVIEW',
    eppStatuses: normalizedEvidence.eppStatuses,
  };
  const updatedHistory = [...history, newHistoryEntry];

  await db
    .update(domainExportTrackingTable)
    .set({
      previousStatus: currentStatus as DomainExportTrackingStatus,
      status: 'NEEDS_ADMIN_REVIEW',
      statusHistory: updatedHistory,
      eppStatuses: normalizedEvidence.eppStatuses,
      whoisData: normalizedEvidence.whoisData as Json,
      statusChangedAt: new Date(),
      lastCheckedAt: new Date(),
      transferCompletedAt: new Date(),
      // Set confirmedOutOfAccountAt if not already set
      confirmedOutOfAccountAt: sql`COALESCE(${domainExportTrackingTable.confirmedOutOfAccountAt}, NOW())`,
      userNotified: false,
    })
    .where(eq(domainExportTrackingTable.id, id));

  logger.debug(
    { domain },
    'Transfer completed - domain no longer in our account',
  );
  return {
    action: 'completed',
    newStatus: 'NEEDS_ADMIN_REVIEW',
    domain,
    chainId,
  };
}

/**
 * Export Tracking Report Generation
 */

export interface ExportTrackingReportMetrics {
  reportDate: Date;
  totalTracked: number;
  statusBreakdown: {
    noSignal: number;
    undetermined: number;
    pendingTransfer: number;
    transferPeriod: number;
    needsAdminReview: number;
    notified: number;
    resolved: number;
    transferFailed: number;
  };
  domains: Array<{
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
    status: string;
    previousStatus: string | null;
    statusChangedAt: Date;
    firstDetectedAt: Date;
    lastCheckedAt: Date;
    eppStatuses?: string[] | null;
    registrarKey?: string | null;
    statusHistory: unknown;
  }>;
}

/**
 * Collect export tracking metrics for report
 */
export async function collectExportTrackingMetrics(): Promise<ExportTrackingReportMetrics> {
  logger.debug('Collecting export tracking metrics for report');

  const allRecords = await db
    .select({
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      ownerAddress: domainExportTrackingTable.ownerAddress,
      status: domainExportTrackingTable.status,
      previousStatus: domainExportTrackingTable.previousStatus,
      statusChangedAt: domainExportTrackingTable.statusChangedAt,
      firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
      lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
      eppStatuses: domainExportTrackingTable.eppStatuses,
      registrarKey: domainExportTrackingTable.registrarKey,
      statusHistory: domainExportTrackingTable.statusHistory,
    })
    .from(domainExportTrackingTable);

  const statusBreakdown = {
    noSignal: allRecords.filter((r) => r.status === 'NO_SIGNAL').length,
    undetermined: allRecords.filter((r) => r.status === 'UNDETERMINED').length,
    pendingTransfer: allRecords.filter((r) => r.status === 'PENDING_TRANSFER')
      .length,
    transferPeriod: allRecords.filter((r) => r.status === 'TRANSFER_PERIOD')
      .length,
    needsAdminReview: allRecords.filter(
      (r) => r.status === 'NEEDS_ADMIN_REVIEW',
    ).length,
    notified: allRecords.filter((r) => r.status === 'NOTIFIED').length,
    resolved: allRecords.filter((r) => r.status === 'RESOLVED').length,
    transferFailed: allRecords.filter((r) => r.status === 'TRANSFER_FAILED')
      .length,
  };

  const metrics: ExportTrackingReportMetrics = {
    reportDate: new Date(),
    totalTracked: allRecords.length,
    statusBreakdown,
    domains: allRecords,
  };

  logger.debug(
    {
      totalTracked: metrics.totalTracked,
      statusBreakdown: metrics.statusBreakdown,
    },
    'Collected export tracking metrics',
  );

  return metrics;
}

/**
 * Generate CSV content for export tracking report
 */
function generateExportTrackingCSV(
  metrics: ExportTrackingReportMetrics,
): string {
  let csv =
    'Domain,Status,Previous Status,Chain ID,Owner Address,Registrar,Status Changed At,First Detected At,Last Checked At,EPP Statuses\n';

  for (const domain of metrics.domains) {
    const statusChangedAt = format(
      domain.statusChangedAt,
      'yyyy-MM-dd HH:mm:ss',
    );
    const firstDetectedAt = format(
      domain.firstDetectedAt,
      'yyyy-MM-dd HH:mm:ss',
    );
    const lastCheckedAt = format(domain.lastCheckedAt, 'yyyy-MM-dd HH:mm:ss');
    const eppStatuses = domain.eppStatuses
      ? (domain.eppStatuses as string[]).join('; ')
      : '';

    csv += `"${domain.domain}","${domain.status}","${domain.previousStatus || ''}",${domain.chainId},"${domain.ownerAddress}","${domain.registrarKey || ''}","${statusChangedAt}","${firstDetectedAt}","${lastCheckedAt}","${eppStatuses}"\n`;
  }

  return csv;
}

/**
 * Generate JSON content for export tracking report
 */
function generateExportTrackingJSON(
  metrics: ExportTrackingReportMetrics,
): string {
  const jsonData = {
    reportDate: format(metrics.reportDate, 'yyyy-MM-dd HH:mm:ss'),
    totalTracked: metrics.totalTracked,
    statusBreakdown: metrics.statusBreakdown,
    domains: metrics.domains.map((domain) => ({
      domain: domain.domain,
      status: domain.status,
      previousStatus: domain.previousStatus,
      chainId: domain.chainId,
      ownerAddress: domain.ownerAddress,
      registrarKey: domain.registrarKey,
      statusChangedAt: format(domain.statusChangedAt, 'yyyy-MM-dd HH:mm:ss'),
      firstDetectedAt: format(domain.firstDetectedAt, 'yyyy-MM-dd HH:mm:ss'),
      lastCheckedAt: format(domain.lastCheckedAt, 'yyyy-MM-dd HH:mm:ss'),
      eppStatuses: domain.eppStatuses,
      statusHistory: domain.statusHistory,
    })),
  };

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Send export tracking report via email
 */
export async function sendExportTrackingReportEmail(
  metrics: ExportTrackingReportMetrics,
): Promise<void> {
  logger.debug('Sending export tracking report email');

  try {
    const dateStr = format(metrics.reportDate, 'yyyy-MM-dd');
    const title = `📊 Domain Export Tracking Report - ${format(metrics.reportDate, 'MMM dd, yyyy')}`;

    // Generate HTML content
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #2c3e50; }
            h2 { color: #34495e; margin-top: 30px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #3498db; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .metrics { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .status-pending { color: #f39c12; font-weight: bold; }
            .status-period { color: #3498db; font-weight: bold; }
            .status-completed { color: #27ae60; font-weight: bold; }
            .status-failed { color: #e74c3c; font-weight: bold; }
            .status-neutral { color: #6b7280; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Generated at:</strong> ${format(metrics.reportDate, 'yyyy-MM-dd HH:mm:ss')} UTC</p>

          <div class="metrics">
            <h2>📈 Summary</h2>
            <ul>
              <li><strong>Total Domains Tracked:</strong> ${metrics.totalTracked}</li>
              <li><span class="status-pending">Pending Transfer:</span> ${metrics.statusBreakdown.pendingTransfer}</li>
              <li><span class="status-period">Transfer Period (60-day lock):</span> ${metrics.statusBreakdown.transferPeriod}</li>
              <li><span class="status-completed">Needs Admin Review:</span> ${metrics.statusBreakdown.needsAdminReview}</li>
              <li><span class="status-completed">Notified:</span> ${metrics.statusBreakdown.notified}</li>
              <li><span class="status-completed">Resolved:</span> ${metrics.statusBreakdown.resolved}</li>
              <li><span class="status-failed">Transfer Failed:</span> ${metrics.statusBreakdown.transferFailed}</li>
              <li><span class="status-neutral">No Signal:</span> ${metrics.statusBreakdown.noSignal}</li>
              <li><span class="status-neutral">Undetermined:</span> ${metrics.statusBreakdown.undetermined}</li>
            </ul>
          </div>

          <h2>📋 Domain Details</h2>
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Previous Status</th>
                <th>Chain</th>
                <th>Registrar</th>
                <th>Status Changed</th>
              </tr>
            </thead>
            <tbody>
    `;

    for (const domain of metrics.domains) {
      const statusClass =
        domain.status === 'PENDING_TRANSFER'
          ? 'status-pending'
          : domain.status === 'TRANSFER_PERIOD'
            ? 'status-period'
            : domain.status === 'TRANSFER_COMPLETED'
              ? 'status-completed'
              : domain.status === 'TRANSFER_FAILED'
                ? 'status-failed'
                : 'status-neutral';

      htmlContent += `
              <tr>
                <td>${domain.domain}</td>
                <td class="${statusClass}">${domain.status}</td>
                <td>${domain.previousStatus || '-'}</td>
                <td>${domain.chainId}</td>
                <td>${domain.registrarKey || '-'}</td>
                <td>${format(domain.statusChangedAt, 'yyyy-MM-dd HH:mm')}</td>
              </tr>
      `;
    }

    htmlContent += `
            </tbody>
          </table>

          <p><em>This is an automated report. Detailed data is available in the attached CSV and JSON files.</em></p>
        </body>
      </html>
    `;

    // Generate attachments
    const attachments = [];

    if (metrics.totalTracked > 0) {
      const csv = generateExportTrackingCSV(metrics);
      attachments.push({
        filename: `export-tracking-${dateStr}.csv`,
        content: csv,
        contentType: 'text/csv',
      });
    }

    const json = generateExportTrackingJSON(metrics);
    attachments.push({
      filename: `export-tracking-${dateStr}.json`,
      content: json,
      contentType: 'application/json',
    });

    await sendMail({
      to: [
        'reports+exports@d3serve.xyz',
        'asset-report-aaaao27zt2zkdocu7mqxfdxvzm@namefi.slack.com',
      ],
      subject: title,
      content: {
        html: htmlContent,
      },
      attachments,
    });

    logger.debug(
      {
        attachmentCount: attachments.length,
        recipient: 'reports+exports@d3serve.xyz',
      },
      'Export tracking report email sent successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to send export tracking report email');
    throw error;
  }
}

/**
 * Burn eligibility reasons
 */
export type BurnEligibilityReason =
  | 'client_approved'
  | 'admin_approved'
  | 'time_confirmed'
  | 'not_eligible';

/**
 * Check if an NFT should be burned based on approval status
 *
 * Burns are allowed when:
 * 1. Client approved (clientApprovedAt is set) - user explicitly approved transfer
 * 2. Admin approved (verifyingAdminId is set) - admin initiated the burn
 * 3. Time confirmed (confirmedOutOfAccountAt > 36 hours ago) - safety net for edge cases
 */
export async function shouldBurnNft(input: {
  domain: NamefiNormalizedDomain;
  chainId: number;
}): Promise<{
  shouldBurn: boolean;
  reason: BurnEligibilityReason;
  trackingRecordId?: string;
}> {
  const { domain, chainId } = input;

  logger.debug({ domain, chainId }, 'Checking NFT burn eligibility');

  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      status: domainExportTrackingTable.status,
      clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
      verifyingAdminId: domainExportTrackingTable.verfyingAdminId,
      confirmedOutOfAccountAt:
        domainExportTrackingTable.confirmedOutOfAccountAt,
      nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        eq(domainExportTrackingTable.normalizedDomainName, domain),
        eq(domainExportTrackingTable.chainId, chainId),
      ),
    )
    .limit(1);

  const record = records[0];

  if (!record) {
    logger.debug({ domain, chainId }, 'No tracking record found');
    return { shouldBurn: false, reason: 'not_eligible' };
  }

  // Already burned
  if (record.nftBurnedAt) {
    logger.debug({ domain, chainId }, 'NFT already burned');
    return {
      shouldBurn: false,
      reason: 'not_eligible',
      trackingRecordId: record.id,
    };
  }

  // Must be in an export-complete state
  const eligibleStatuses: DomainExportTrackingStatus[] = [
    'TRANSFER_COMPLETED',
    'NEEDS_ADMIN_REVIEW',
    'NOTIFIED',
  ];
  if (!eligibleStatuses.includes(record.status as DomainExportTrackingStatus)) {
    logger.debug(
      { domain, chainId, status: record.status },
      'Domain not in export-complete status',
    );
    return {
      shouldBurn: false,
      reason: 'not_eligible',
      trackingRecordId: record.id,
    };
  }

  // Check client approval
  if (record.clientApprovedAt) {
    logger.debug({ domain, chainId }, 'Burn eligible: client approved');
    return {
      shouldBurn: true,
      reason: 'client_approved',
      trackingRecordId: record.id,
    };
  }

  // Check admin approval
  if (record.verifyingAdminId) {
    logger.debug({ domain, chainId }, 'Burn eligible: admin approved');
    return {
      shouldBurn: true,
      reason: 'admin_approved',
      trackingRecordId: record.id,
    };
  }

  // Check time-based confirmation (36+ hours out of account)
  if (record.confirmedOutOfAccountAt) {
    const hoursOutOfAccount = differenceInHours(
      new Date(),
      record.confirmedOutOfAccountAt,
    );
    if (hoursOutOfAccount >= MIN_HOURS_FOR_TIME_BASED_BURN) {
      logger.debug(
        { domain, chainId, hoursOutOfAccount },
        'Burn eligible: time-based confirmation (%d hours)',
        hoursOutOfAccount,
      );
      return {
        shouldBurn: true,
        reason: 'time_confirmed',
        trackingRecordId: record.id,
      };
    }
    logger.debug(
      {
        domain,
        chainId,
        hoursOutOfAccount,
        required: MIN_HOURS_FOR_TIME_BASED_BURN,
      },
      'Not enough time for time-based burn',
    );
  }

  return {
    shouldBurn: false,
    reason: 'not_eligible',
    trackingRecordId: record.id,
  };
}

/**
 * Get domains eligible for NFT burning
 * Returns completed transfers that haven't been burned yet
 * Filters by ALLOWED_CHAINS config to only process burns on chains relevant to the current environment
 */
export async function getDomainsEligibleForBurn(): Promise<
  Array<{
    id: string;
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
    clientApprovedAt: Date | null;
    verifyingAdminId: string | null;
    confirmedOutOfAccountAt: Date | null;
  }>
> {
  const allowedChains = getAllowedChainsForNft();
  logger.debug(
    { allowedChains },
    'Getting domains eligible for NFT burning on allowed chains',
  );

  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      ownerAddress: domainExportTrackingTable.ownerAddress,
      clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
      verifyingAdminId: domainExportTrackingTable.verfyingAdminId,
      confirmedOutOfAccountAt:
        domainExportTrackingTable.confirmedOutOfAccountAt,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        inArray(domainExportTrackingTable.status, [
          'TRANSFER_COMPLETED',
          'NEEDS_ADMIN_REVIEW',
          'NOTIFIED',
        ]),
        isNull(domainExportTrackingTable.nftBurnedAt),
        inArray(domainExportTrackingTable.chainId, allowedChains),
      ),
    );

  logger.debug(
    { count: records.length },
    'Found domains eligible for burn check',
  );

  return records;
}

/**
 * Record the result of an NFT burn operation
 */
export async function recordNftBurn(input: {
  domain: NamefiNormalizedDomain;
  chainId: number;
  txHash?: string;
  error?: string;
}): Promise<void> {
  const { domain, chainId, txHash, error } = input;

  logger.debug({ domain, chainId, txHash, error }, 'Recording NFT burn result');

  if (txHash) {
    // Successful burn
    await db
      .update(domainExportTrackingTable)
      .set({
        previousStatus: sql`${domainExportTrackingTable.status}`,
        status: 'RESOLVED',
        nftBurnedAt: new Date(),
        nftBurnTxHash: txHash,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(domainExportTrackingTable.normalizedDomainName, domain),
          eq(domainExportTrackingTable.chainId, chainId),
        ),
      );
    logger.debug({ domain, chainId, txHash }, 'Recorded successful NFT burn');
  } else if (error) {
    // Failed burn - we don't have a dedicated error column, so just log it
    logger.error({ domain, chainId, error }, 'NFT burn failed');
  }
}

/**
 * Send email notification for pending domain export
 */
export async function sendPendingExportEmail(input: {
  userId: string;
  domain: NamefiNormalizedDomain;
  registrarKey: string;
}): Promise<{ sent: boolean }> {
  const { userId, domain, registrarKey } = input;

  logger.debug(
    { userId, domain, registrarKey },
    'Sending pending export email',
  );

  const email = await maybeGetUserEmail(userId);
  if (!email) {
    logger.debug(
      { userId, domain },
      'No email found for user, skipping notification',
    );
    return { sent: false };
  }

  const isCentralNic =
    registrarKey?.toLowerCase().includes('centralnic') ?? false;

  const html = await render(
    React.createElement(DomainExportPending, {
      domainName: domain,
      supportsApprovingExport: isCentralNic,
    } satisfies DomainExportPendingProps),
  );

  await sendMail({
    to: ENABLE_EXPORT_EMAILS ? [email] : EMAIL_BCC,
    bcc: EMAIL_BCC,
    subject: `Domain Export Request Detected: ${domain}`,
    content: { html },
  });

  logger.debug({ userId, domain, email }, 'Pending export email sent');
  return { sent: true };
}

/**
 * Send email notification for completed domain export
 */
export async function sendExportCompleteEmail(input: {
  userId: string;
  domain: NamefiNormalizedDomain;
  chainId: number;
  nftBurnTxHash?: string;
}): Promise<{ sent: boolean }> {
  const { userId, domain, chainId, nftBurnTxHash } = input;

  logger.debug(
    { userId, domain, chainId, nftBurnTxHash },
    'Sending export complete email',
  );

  const email = await maybeGetUserEmail(userId);
  if (!email) {
    logger.debug(
      { userId, domain },
      'No email found for user, skipping notification',
    );
    return { sent: false };
  }

  const html = await render(
    React.createElement(DomainExportComplete, {
      domainName: domain,
      chainId,
      nftBurnTxHash,
    } satisfies DomainExportCompleteProps),
  );

  await sendMail({
    to: ENABLE_EXPORT_EMAILS ? [email] : EMAIL_BCC,
    bcc: EMAIL_BCC,
    subject: `Domain Export Completed: ${domain}`,
    content: { html },
  });

  logger.debug({ userId, domain, email }, 'Export complete email sent');
  return { sent: true };
}

/**
 * Get user ID from owner address
 * Uses privyClient to look up the Privy user by wallet, then finds the internal user ID
 */
export async function getUserIdFromOwnerAddress(
  ownerAddress: string,
): Promise<string | null> {
  const { usersTable } = await import('@namefi-astra/db');

  // First, look up the Privy user by wallet address
  const privyUser = await privyClient.getUserByWalletAddress(ownerAddress);
  if (!privyUser) {
    logger.debug({ ownerAddress }, 'No Privy user found for wallet address');
    return null;
  }

  // Then query the users table by privyUserId
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.privyUserId, privyUser.id))
    .limit(1);

  return users[0]?.id || null;
}
