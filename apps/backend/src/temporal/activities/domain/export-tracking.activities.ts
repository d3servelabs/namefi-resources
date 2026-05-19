/**
 * Domain export tracking — Temporal activities.
 *
 * Pipeline (per-domain, every workflow tick):
 *   gatherEvidenceForDomain  →  decideExportTrackingState  →  persist transition
 *                              (per-source array,            (action mapped to
 *                               7 status values)              tracking status)
 *
 * Notification state lives in dedicated per-email-type columns on the
 * `domain_export_tracking` table; the email-send functions self-write
 * `*ExportEmailSentAt`, `*ExportEmailAttempts`, `*ExportEmailLastError`,
 * etc., on both success and failure so retries are visible to admins.
 *
 * Terminal rows (`TRANSFER_COMPLETED`, `TRANSFER_FAILED`, `RESOLVED`) flip
 * `isActive = false` on the same UPDATE and are never mutated again. A
 * partial unique index enforces at most one active row per (domain, chainId).
 */
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
import { toPunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import { RDAP } from '@namefi-astra/registrars/rdap-whois/rdap_client';
import { WhoisClient } from '@namefi-astra/registrars/rdap-whois/whois_client';
import type {
  PendingTransferInfo,
  TransferStatus,
} from '@namefi-astra/registrars/data/types/transfer-status';
import type { RdapResponse } from '@namefi-astra/registrars/rdap-whois/rdap-response';
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
import {
  DomainExportFailed,
  type DomainExportFailedProps,
} from '../../../mail/templates/domain-export-failed';
import { maybeGetUserEmail } from '../notify.activities';
import { privyClient } from '../../../trpc/utils';
import {
  appendExportTrackingStatusHistory,
  actionToTrackingStatus,
  EXPORT_BURN_ELIGIBLE_STATUSES,
  isAdminApprovedForPendingNotification,
  isBurnEligibleExportStatus,
  isTerminalStatus,
  mapDecisionToPersistedStatus,
  type DomainExportTrackingStatus,
  type ExportTrackingStatusHistoryEntry,
  type TransferDecisionAction,
} from './export-tracking-state';

// =====================================================================
// CONFIG
// =====================================================================

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

// =====================================================================
// EVIDENCE TYPES
// =====================================================================

/**
 * Named evidence sources queried per-domain. Each source contributes one
 * `EvidenceSourceResult` to the array returned by `gatherEvidenceForDomain`.
 */
export type EvidenceSourceName =
  | 'AccountCheck' // sldRegistrar.getDomainDetails — is the domain in our account?
  | 'RDAPStatus' // RDAP queryDomain — EPP-like status[] field
  | 'RDAPEvents' // RDAP queryDomain — events[] field with transfer actions
  | 'WHOIS' // WhoisClient queryDomain — fallback status parsing
  | 'DirectRegistrar'; // sldRegistrar.queryPendingTransfer — registrar-native query (incl. R53 ListOperations)

/**
 * Outcome from a single evidence source. The decision function reads the
 * full array and combines under explicit priority rules.
 *
 *  - positive_pending:   source reports an in-progress transfer (EPP
 *                        pendingTransfer, R53 IN_PROGRESS, registrar 'pending').
 *  - positive_period:    source reports the post-transfer lock period.
 *  - positive_completed: source reports the transfer finished and the domain
 *                        left our account (RDAP transfer event, R53
 *                        SUCCESSFUL, clientApproved/serverApproved, or
 *                        account check confirms domain is gone).
 *  - positive_failed:    source reports the transfer was cancelled/rejected.
 *  - negative:           source affirmatively said "no transfer signal".
 *  - no_data:            source responded but had no information about the
 *                        domain (e.g. RDAP returned a record without events,
 *                        domain unknown to this source).
 *  - error:              source threw an exception (network, 5xx, parse).
 *                        `error` field carries the message for admin debug.
 */
export type EvidenceSourceStatus =
  | 'positive_pending'
  | 'positive_period'
  | 'positive_completed'
  | 'positive_failed'
  | 'negative'
  | 'no_data'
  | 'error';

export interface EvidenceSourceResult {
  source: EvidenceSourceName;
  status: EvidenceSourceStatus;
  /** Raw response payload (for admin debug). May be undefined for error/no_data. */
  evidence?: unknown;
  /** Populated when status === 'error'. */
  error?: string;
  /** ISO timestamp of when this source was checked. */
  checkedAt: string;
}

interface LatestExportTrackingEvidenceSnapshot {
  checkedAt: string;
  decisionAction: TransferDecisionAction;
  decisionReason: string;
  sources: EvidenceSourceResult[];
  eppStatuses?: string[];
}

const ACTIVE_PENDING_TRANSFER_STATUSES = new Set<PendingTransferInfo['status']>(
  ['pending'],
);

const FINISHED_TRANSFER_STATUSES = new Set<PendingTransferInfo['status']>([
  'clientApproved',
  'serverApproved',
]);

const FAILED_TRANSFER_STATUSES = new Set<PendingTransferInfo['status']>([
  'clientRejected',
  'serverRejected',
  'clientCancelled',
  'serverCancelled',
]);

// =====================================================================
// EVIDENCE PARSING HELPERS
// =====================================================================

function detectTransferSignalsFromStatuses(
  statuses: readonly string[] | undefined,
): {
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

  const normalized = EppStatuses.fromArray(statuses);
  return {
    eppStatuses: normalized.getEppStatuses(),
    hasPendingTransfer: normalized.hasStatus('pendingTransfer'),
    hasTransferPeriod: normalized.hasStatus('transferPeriod'),
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

function findRdapTransferEvent(rdap: RdapResponse): {
  eventAction: string;
  eventDate?: string;
} | null {
  if (!Array.isArray(rdap.events)) {
    return null;
  }
  for (const event of rdap.events) {
    if (!event || typeof event !== 'object') continue;
    const eventAction = (event as { eventAction?: unknown }).eventAction;
    if (typeof eventAction !== 'string') continue;
    if (!/\btransfer(?:red)?\b/i.test(eventAction)) continue;
    const eventDate = (event as { eventDate?: unknown }).eventDate;
    return {
      eventAction,
      eventDate: typeof eventDate === 'string' ? eventDate : undefined,
    };
  }
  return null;
}

// =====================================================================
// EVIDENCE SOURCES
//
// Each function returns exactly one EvidenceSourceResult. Exceptions are
// caught and surfaced as status === 'error' so the decision function
// always sees a complete picture, never undefined.
// =====================================================================

/**
 * Is the domain currently in one of our managed registrar accounts?
 *
 * Returns:
 *  - `positive_completed`: domain is confirmed out of our account (it left).
 *  - `negative`: domain is still in our account.
 *  - `error`: registrar call threw.
 */
async function queryAccountCheck(
  domain: NamefiNormalizedDomain,
): Promise<EvidenceSourceResult> {
  const checkedAt = new Date().toISOString();
  try {
    const punyDomain = toPunycodeDomainName(domain);
    const domainDetails = await sldRegistrar.getDomainDetails(punyDomain);
    if (!domainDetails) {
      return {
        source: 'AccountCheck',
        status: 'positive_completed',
        evidence: { inOurAccount: false },
        checkedAt,
      };
    }
    return {
      source: 'AccountCheck',
      status: 'negative',
      evidence: {
        inOurAccount: true,
        registrarKey: domainDetails.registrarKey,
      },
      checkedAt,
    };
  } catch (error) {
    return {
      source: 'AccountCheck',
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      checkedAt,
    };
  }
}

/**
 * Pure function: derive an EPP-status evidence result from a previously
 * fetched RDAP response (or an RDAP fetch error).
 */
function rdapStatusToEvidence(rdapResult: {
  data?: RdapResponse;
  error?: unknown;
}): EvidenceSourceResult {
  const checkedAt = new Date().toISOString();
  if (rdapResult.error) {
    return {
      source: 'RDAPStatus',
      status: 'error',
      error:
        rdapResult.error instanceof Error
          ? rdapResult.error.message
          : String(rdapResult.error),
      checkedAt,
    };
  }
  if (!rdapResult.data) {
    return { source: 'RDAPStatus', status: 'no_data', checkedAt };
  }
  const signals = detectTransferSignalsFromStatuses(rdapResult.data.status);
  if (signals.hasPendingTransfer) {
    return {
      source: 'RDAPStatus',
      status: 'positive_pending',
      evidence: { eppStatuses: signals.eppStatuses },
      checkedAt,
    };
  }
  if (signals.hasTransferPeriod) {
    return {
      source: 'RDAPStatus',
      status: 'positive_period',
      evidence: { eppStatuses: signals.eppStatuses },
      checkedAt,
    };
  }
  if (signals.eppStatuses && signals.eppStatuses.length > 0) {
    return {
      source: 'RDAPStatus',
      status: 'negative',
      evidence: { eppStatuses: signals.eppStatuses },
      checkedAt,
    };
  }
  return { source: 'RDAPStatus', status: 'no_data', checkedAt };
}

/**
 * Pure function: derive a transfer-event evidence result from a previously
 * fetched RDAP response. Per RFC 9083, RDAP responses may include an
 * `events` array; an `eventAction` of `transfer` indicates a completed
 * outbound transfer.
 */
function rdapEventsToEvidence(rdapResult: {
  data?: RdapResponse;
  error?: unknown;
}): EvidenceSourceResult {
  const checkedAt = new Date().toISOString();
  if (rdapResult.error) {
    return {
      source: 'RDAPEvents',
      status: 'error',
      error:
        rdapResult.error instanceof Error
          ? rdapResult.error.message
          : String(rdapResult.error),
      checkedAt,
    };
  }
  if (!rdapResult.data) {
    return { source: 'RDAPEvents', status: 'no_data', checkedAt };
  }
  const transferEvent = findRdapTransferEvent(rdapResult.data);
  if (transferEvent) {
    return {
      source: 'RDAPEvents',
      status: 'positive_completed',
      evidence: transferEvent,
      checkedAt,
    };
  }
  return { source: 'RDAPEvents', status: 'no_data', checkedAt };
}

/**
 * WHOIS fallback for EPP-status evidence. Independently queried (no longer
 * a fallback to RDAP). Useful when RDAP fails or returns sparse data.
 */
async function queryWhoisEvidence(
  domain: NamefiNormalizedDomain,
): Promise<EvidenceSourceResult> {
  const checkedAt = new Date().toISOString();
  try {
    const punyDomain = toPunycodeDomainName(domain);
    const whoisResult = await WhoisClient.queryDomain(punyDomain);
    const whoisStatuses = extractWhoisStatuses(whoisResult);
    const signals = detectTransferSignalsFromStatuses(whoisStatuses);

    let hasPendingTransfer = signals.hasPendingTransfer;
    let hasTransferPeriod = signals.hasTransferPeriod;
    if (!hasPendingTransfer && !hasTransferPeriod) {
      const whoisText = JSON.stringify(whoisResult).toLowerCase();
      hasPendingTransfer =
        whoisText.includes('pending transfer') ||
        whoisText.includes('pendingtransfer');
      hasTransferPeriod =
        whoisText.includes('transfer period') ||
        whoisText.includes('transferperiod');
    }

    if (hasPendingTransfer) {
      return {
        source: 'WHOIS',
        status: 'positive_pending',
        evidence: { eppStatuses: signals.eppStatuses },
        checkedAt,
      };
    }
    if (hasTransferPeriod) {
      return {
        source: 'WHOIS',
        status: 'positive_period',
        evidence: { eppStatuses: signals.eppStatuses },
        checkedAt,
      };
    }
    if (signals.eppStatuses && signals.eppStatuses.length > 0) {
      return {
        source: 'WHOIS',
        status: 'negative',
        evidence: { eppStatuses: signals.eppStatuses },
        checkedAt,
      };
    }
    return { source: 'WHOIS', status: 'no_data', checkedAt };
  } catch (error) {
    return {
      source: 'WHOIS',
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      checkedAt,
    };
  }
}

/**
 * Direct registrar query. Dispatches via sldRegistrar to the domain's
 * registrar (Dynadot, CentralNic, Route 53 — R53 now uses
 * ListOperationsCommand under the hood). Returns the strongest available
 * signal: the registrar's own view of the transfer state.
 */
async function queryDirectRegistrarEvidence(
  domain: NamefiNormalizedDomain,
): Promise<EvidenceSourceResult> {
  const checkedAt = new Date().toISOString();
  try {
    const pending = await sldRegistrar.queryPendingTransfer(
      toPunycodeDomainName(domain),
    );
    if (!pending) {
      return { source: 'DirectRegistrar', status: 'no_data', checkedAt };
    }
    if (ACTIVE_PENDING_TRANSFER_STATUSES.has(pending.status)) {
      return {
        source: 'DirectRegistrar',
        status: 'positive_pending',
        evidence: pending,
        checkedAt,
      };
    }
    if (FINISHED_TRANSFER_STATUSES.has(pending.status)) {
      return {
        source: 'DirectRegistrar',
        status: 'positive_completed',
        evidence: pending,
        checkedAt,
      };
    }
    if (FAILED_TRANSFER_STATUSES.has(pending.status)) {
      return {
        source: 'DirectRegistrar',
        status: 'positive_failed',
        evidence: pending,
        checkedAt,
      };
    }
    return {
      source: 'DirectRegistrar',
      status: 'no_data',
      evidence: pending,
      checkedAt,
    };
  } catch (error) {
    return {
      source: 'DirectRegistrar',
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      checkedAt,
    };
  }
}

// =====================================================================
// EVIDENCE GATHERING
// =====================================================================

/**
 * Query every evidence source for a domain in parallel and return the array.
 *
 * Every source returns even on failure (as an `error`-tagged result), so the
 * decision function always sees a complete picture. No source is "preferred"
 * over another — the decision function applies its own priority rules.
 *
 * RDAP is queried once and consumed by two sources (`RDAPStatus`,
 * `RDAPEvents`) — one HTTP call, two evidence entries.
 */
export async function gatherEvidenceForDomain(input: {
  domain: NamefiNormalizedDomain;
}): Promise<EvidenceSourceResult[]> {
  const { domain } = input;
  const activityContext = Context.current();
  activityContext.heartbeat({ domain, step: 'gather_evidence' });

  const rdapPromise: Promise<{ data?: RdapResponse; error?: unknown }> =
    RDAP.queryDomain(toPunycodeDomainName(domain))
      .then((data) => ({ data }))
      .catch((error) => ({ error }));

  const [accountCheck, rdapResult, whois, directRegistrar] = await Promise.all([
    queryAccountCheck(domain),
    rdapPromise,
    queryWhoisEvidence(domain),
    queryDirectRegistrarEvidence(domain),
  ]);

  const rdapStatus = rdapStatusToEvidence(rdapResult);
  const rdapEvents = rdapEventsToEvidence(rdapResult);

  return [accountCheck, rdapStatus, rdapEvents, whois, directRegistrar];
}

// =====================================================================
// DECISION LOGIC
// =====================================================================

function hasSourceStatus(
  evidence: EvidenceSourceResult[],
  source: EvidenceSourceName,
  status: EvidenceSourceStatus,
): boolean {
  return evidence.some((e) => e.source === source && e.status === status);
}

function anyStatus(
  evidence: EvidenceSourceResult[],
  status: EvidenceSourceStatus,
): boolean {
  return evidence.some((e) => e.status === status);
}

function getEvidenceBy(
  evidence: EvidenceSourceResult[],
  source: EvidenceSourceName,
): EvidenceSourceResult | undefined {
  return evidence.find((e) => e.source === source);
}

/**
 * Combine the per-source evidence array into a single decision.
 *
 * Priority rules (first match wins):
 *
 *   1. Any source reports `positive_pending` → PENDING_TRANSFER.
 *   2. Any source reports `positive_period` → TRANSFER_PERIOD.
 *   3. Direct registrar reports `positive_failed` → TRANSFER_FAILED.
 *      (Registrar-native cancellation is authoritative.)
 *   4. AccountCheck confirms domain is gone (`positive_completed`) AND
 *      at least one other source corroborates (`positive_completed`
 *      from DirectRegistrar or RDAPEvents) → TRANSFER_COMPLETED.
 *   5. AccountCheck confirms domain is gone, with no contradicting in-flight
 *      signal → TRANSFER_COMPLETED.
 *   6. Every source is `error` or `no_data` → UNDETERMINED.
 *   7. Otherwise → NO_SIGNAL.
 *
 * Tie-breaking: in-progress beats completion (rule #1 wins over #4-5),
 * because we'd rather wait an extra cycle than burn an NFT for a domain
 * that's still ours.
 *
 * An `error` from one source does NOT block — as long as some other source
 * gave a usable verdict, we proceed. UNDETERMINED only fires when nothing
 * works.
 */
export function decideExportTrackingState(evidence: EvidenceSourceResult[]): {
  action: TransferDecisionAction;
  reason: string;
} {
  const reasonSources = (status: EvidenceSourceStatus): string =>
    evidence
      .filter((e) => e.status === status)
      .map((e) => e.source)
      .join(', ');

  if (anyStatus(evidence, 'positive_pending')) {
    return {
      action: 'PENDING_TRANSFER',
      reason: `pending-transfer signal from: ${reasonSources('positive_pending')}`,
    };
  }

  if (anyStatus(evidence, 'positive_period')) {
    return {
      action: 'TRANSFER_PERIOD',
      reason: `transfer-period signal from: ${reasonSources('positive_period')}`,
    };
  }

  if (hasSourceStatus(evidence, 'DirectRegistrar', 'positive_failed')) {
    return {
      action: 'TRANSFER_FAILED',
      reason: 'direct registrar reports cancelled/rejected transfer',
    };
  }

  const accountCheck = getEvidenceBy(evidence, 'AccountCheck');
  const accountConfirmsGone = accountCheck?.status === 'positive_completed';
  const directCorroborates = hasSourceStatus(
    evidence,
    'DirectRegistrar',
    'positive_completed',
  );
  const rdapEventsCorroborates = hasSourceStatus(
    evidence,
    'RDAPEvents',
    'positive_completed',
  );

  if (accountConfirmsGone && (directCorroborates || rdapEventsCorroborates)) {
    const sources: string[] = ['AccountCheck'];
    if (directCorroborates) sources.push('DirectRegistrar');
    if (rdapEventsCorroborates) sources.push('RDAPEvents');
    return {
      action: 'TRANSFER_COMPLETED',
      reason: `confirmed export from: ${sources.join(', ')}`,
    };
  }

  if (accountConfirmsGone) {
    return {
      action: 'TRANSFER_COMPLETED',
      reason: 'AccountCheck confirms domain is no longer in our account',
    };
  }

  const allInert = evidence.every(
    (e) => e.status === 'error' || e.status === 'no_data',
  );
  if (allInert) {
    const erroredSources = evidence
      .filter((e) => e.status === 'error')
      .map((e) => e.source);
    return {
      action: 'UNDETERMINED',
      reason: erroredSources.length
        ? `no usable evidence; errors from: ${erroredSources.join(', ')}`
        : 'no usable evidence from any source',
    };
  }

  return {
    action: 'NO_SIGNAL',
    reason: 'no explicit transfer signal across sources',
  };
}

function buildLatestEvidenceSnapshot(input: {
  evidence: EvidenceSourceResult[];
  decision: { action: TransferDecisionAction; reason: string };
  checkedAt?: Date;
}): LatestExportTrackingEvidenceSnapshot {
  const { evidence, decision, checkedAt = new Date() } = input;

  // Surface the EPP statuses (if any) flat in the snapshot for quick admin
  // scanning. Prefer RDAPStatus then WHOIS then DirectRegistrar.
  let eppStatuses: string[] | undefined;
  for (const source of ['RDAPStatus', 'WHOIS', 'DirectRegistrar'] as const) {
    const e = evidence.find(
      (entry) => entry.source === source && entry.evidence,
    );
    const evidenceEpp = (e?.evidence as { eppStatuses?: string[] } | undefined)
      ?.eppStatuses;
    if (evidenceEpp && evidenceEpp.length > 0) {
      eppStatuses = evidenceEpp;
      break;
    }
  }

  return {
    checkedAt: checkedAt.toISOString(),
    decisionAction: decision.action,
    decisionReason: decision.reason,
    sources: evidence,
    eppStatuses,
  };
}

function getEppStatusesFromEvidence(
  evidence: EvidenceSourceResult[],
): string[] | undefined {
  for (const source of ['RDAPStatus', 'WHOIS', 'DirectRegistrar'] as const) {
    const e = evidence.find(
      (entry) => entry.source === source && entry.evidence,
    );
    const epp = (e?.evidence as { eppStatuses?: string[] } | undefined)
      ?.eppStatuses;
    if (epp && epp.length > 0) return epp;
  }
  return undefined;
}

function getRegistrarKeyFromEvidence(
  evidence: EvidenceSourceResult[],
): string | undefined {
  const accountCheck = evidence.find((e) => e.source === 'AccountCheck');
  return (accountCheck?.evidence as { registrarKey?: string } | undefined)
    ?.registrarKey;
}

function getRdapDataFromEvidence(
  evidence: EvidenceSourceResult[],
): unknown | undefined {
  return evidence.find((e) => e.source === 'RDAPStatus')?.evidence;
}

// =====================================================================
// PERSISTENCE HELPERS
// =====================================================================

/**
 * Find the active tracking row for (domain, chainId). Terminal rows
 * (isActive = false) are excluded — a new tracking cycle creates a new row.
 */
export async function getActiveTrackingRecord(
  domain: NamefiNormalizedDomain,
  chainId: number,
): Promise<{
  id: string;
  status: string;
  statusHistory: unknown;
  registrarKey?: string | null;
  pendingExportEmailSentAt: Date | null;
  clientApprovedAt: Date | null;
  adminVerifiedAt: Date | null;
} | null> {
  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      status: domainExportTrackingTable.status,
      statusHistory: domainExportTrackingTable.statusHistory,
      registrarKey: domainExportTrackingTable.registrarKey,
      pendingExportEmailSentAt:
        domainExportTrackingTable.pendingExportEmailSentAt,
      clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
      adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        eq(domainExportTrackingTable.normalizedDomainName, domain),
        eq(domainExportTrackingTable.chainId, chainId),
        eq(domainExportTrackingTable.isActive, true),
      ),
    )
    .limit(1);

  return records[0] || null;
}

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
 * Backwards-compatible re-export: previously a public activity, now the
 * AccountCheck evidence source carries this signal. Kept exported because
 * other call sites may use it as a standalone check.
 */
export async function isDomainInOurAccount(
  domain: NamefiNormalizedDomain,
): Promise<{
  inOurAccount: boolean;
  registrarKey?: string;
  confirmed: boolean;
}> {
  const result = await queryAccountCheck(domain);
  if (result.status === 'error') {
    return { inOurAccount: false, confirmed: false };
  }
  const ev = result.evidence as
    | { inOurAccount: boolean; registrarKey?: string }
    | undefined;
  return {
    inOurAccount: ev?.inOurAccount ?? false,
    registrarKey: ev?.registrarKey,
    confirmed: true,
  };
}

// =====================================================================
// ACTIVITIES — entry points called from workflows
// =====================================================================

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
 * Process a single domain through the export-tracking pipeline.
 *
 *  1. Gather evidence from all sources (parallel).
 *  2. Decide the next state via priority rules.
 *  3. Look up the active row for (domain, chainId).
 *  4. Apply the transition:
 *     - NO_SIGNAL + no active row → skip (don't create a row).
 *     - NO_SIGNAL + active row    → update `lastCheckedAt` + evidence only.
 *     - Terminal decision         → set isActive=false on the same UPDATE.
 *     - Otherwise                  → update or create active row.
 *  5. If the persisted status is PENDING_TRANSFER and the evidence is
 *     "trusted" (DIRECT_REGISTRAR or admin-approved), send the pending
 *     export email — the email function self-writes attempt columns.
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
  pendingEmailSent?: boolean;
  failedEmailSent?: boolean;
}> {
  const { domain, chainId, ownerAddress } = input;
  const activityContext = Context.current();

  logger.debug({ domain, chainId }, 'Processing single domain export status');
  activityContext.heartbeat({ domain, step: 'checking_status' });

  const evidence = await gatherEvidenceForDomain({ domain });
  const decision = decideExportTrackingState(evidence);

  const persistedStatus = mapDecisionToPersistedStatus(decision.action);
  if (!persistedStatus) {
    logger.debug(
      { domain, decision },
      'Decision did not map to a tracking status',
    );
    return { action: 'skipped' };
  }

  const evidenceCheckedAt = new Date();
  const latestEvidence = buildLatestEvidenceSnapshot({
    evidence,
    decision,
    checkedAt: evidenceCheckedAt,
  });
  const eppStatuses = getEppStatusesFromEvidence(evidence);
  const rdapData = getRdapDataFromEvidence(evidence);
  const indexRegistrarKey = await getDomainRegistrarFromIndex(domain);
  const registrarKey =
    getRegistrarKeyFromEvidence(evidence) ?? indexRegistrarKey ?? undefined;

  const existingRecord = await getActiveTrackingRecord(domain, chainId);

  // NO_SIGNAL: don't persist a fresh row; just touch lastCheckedAt on
  // existing active rows so we have heartbeat data.
  if (decision.action === 'NO_SIGNAL') {
    if (existingRecord) {
      await db
        .update(domainExportTrackingTable)
        .set({
          lastCheckedAt: evidenceCheckedAt,
          eppStatuses,
          whoisData: rdapData as Json,
          latestEvidence,
        })
        .where(eq(domainExportTrackingTable.id, existingRecord.id));
    }
    return { action: 'no_signal', status: persistedStatus };
  }

  const decisionIsTerminal = isTerminalStatus(persistedStatus);

  if (existingRecord) {
    const pendingAlreadySent = Boolean(existingRecord.pendingExportEmailSentAt);
    const adminApproved = isAdminApprovedForPendingNotification({
      clientApprovedAt: existingRecord.clientApprovedAt,
      adminVerifiedAt: existingRecord.adminVerifiedAt,
    });

    if (existingRecord.status !== persistedStatus) {
      const now = new Date();
      const statusHistory = appendExportTrackingStatusHistory(
        existingRecord.statusHistory as
          | ExportTrackingStatusHistoryEntry[]
          | null,
        persistedStatus,
        {
          now,
          reason: decision.reason,
          evidence: { ...latestEvidence, actor: 'workflow' },
          eppStatuses,
        },
      );

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: existingRecord.status as DomainExportTrackingStatus,
          status: persistedStatus,
          statusHistory,
          eppStatuses,
          whoisData: rdapData as Json,
          latestEvidence,
          registrarKey,
          statusChangedAt: now,
          lastCheckedAt: now,
          transferCompletedAt:
            decision.action === 'TRANSFER_COMPLETED' ? now : undefined,
          confirmedOutOfAccountAt:
            decision.action === 'TRANSFER_COMPLETED'
              ? sql`COALESCE(${domainExportTrackingTable.confirmedOutOfAccountAt}, NOW())`
              : undefined,
          isActive: decisionIsTerminal
            ? false
            : sql`${domainExportTrackingTable.isActive}`,
        })
        .where(eq(domainExportTrackingTable.id, existingRecord.id));

      // Send pending email when transitioning into PENDING_TRANSFER for the
      // first time, with trusted evidence (direct registrar) or admin gate.
      const pendingEmailSent = await maybeSendPendingExportEmail({
        decision,
        evidence,
        existingPendingSent: pendingAlreadySent,
        adminApproved,
        trackingRecordId: existingRecord.id,
        ownerAddress,
        domain,
        registrarKey,
      });

      // Mirror the registrar-confirmed-failure email path that
      // checkSinglePendingTransfer triggers, so a row that lands directly
      // in TRANSFER_FAILED from the main scan still notifies the user.
      const failedEmailSent =
        decision.action === 'TRANSFER_FAILED'
          ? await maybeSendFailedExportEmail({
              trackingRecordId: existingRecord.id,
              ownerAddress,
              domain,
              reason: decision.reason,
            })
          : false;

      return {
        action: 'updated',
        status: persistedStatus,
        previousStatus: existingRecord.status,
        pendingEmailSent,
        failedEmailSent,
      };
    }

    // Same status: just touch lastCheckedAt and refresh evidence.
    await db
      .update(domainExportTrackingTable)
      .set({
        lastCheckedAt: new Date(),
        eppStatuses,
        whoisData: rdapData as Json,
        latestEvidence,
      })
      .where(eq(domainExportTrackingTable.id, existingRecord.id));

    // Same-status path may still want to send the pending email if it
    // wasn't sent before and evidence is trusted now.
    const pendingEmailSent = await maybeSendPendingExportEmail({
      decision,
      evidence,
      existingPendingSent: pendingAlreadySent,
      adminApproved,
      trackingRecordId: existingRecord.id,
      ownerAddress,
      domain,
      registrarKey,
    });

    return {
      action: 'no_change',
      status: persistedStatus,
      pendingEmailSent,
    };
  }

  // No active row exists: insert a fresh one.
  const now = new Date();
  const initialHistory = appendExportTrackingStatusHistory(
    [],
    persistedStatus,
    {
      now,
      reason: decision.reason,
      evidence: { ...latestEvidence, actor: 'workflow' },
      eppStatuses,
    },
  );

  const insertedRows = await db
    .insert(domainExportTrackingTable)
    .values({
      normalizedDomainName: domain,
      chainId,
      ownerAddress,
      status: persistedStatus,
      statusHistory: initialHistory,
      eppStatuses,
      whoisData: rdapData as Json,
      latestEvidence,
      registrarKey,
      isActive: decisionIsTerminal ? false : true,
      transferCompletedAt:
        decision.action === 'TRANSFER_COMPLETED' ? now : undefined,
      confirmedOutOfAccountAt:
        decision.action === 'TRANSFER_COMPLETED' ? now : undefined,
    })
    .returning({ id: domainExportTrackingTable.id });

  const trackingRecordId = insertedRows[0]?.id;

  if (decision.action === 'UNDETERMINED') {
    return {
      action: 'created',
      status: persistedStatus,
      domain,
      chainId,
      ownerAddress,
      registrarKey,
    };
  }

  const pendingEmailSent = trackingRecordId
    ? await maybeSendPendingExportEmail({
        decision,
        evidence,
        existingPendingSent: false,
        adminApproved: false,
        trackingRecordId,
        ownerAddress,
        domain,
        registrarKey,
      })
    : false;

  // Initial-scan TRANSFER_FAILED: also auto-send the failed email so the
  // user is notified even when the row never went through the pending
  // re-check loop.
  const failedEmailSent =
    trackingRecordId && decision.action === 'TRANSFER_FAILED'
      ? await maybeSendFailedExportEmail({
          trackingRecordId,
          ownerAddress,
          domain,
          reason: decision.reason,
        })
      : false;

  return {
    action: 'created',
    status: persistedStatus,
    domain,
    chainId,
    ownerAddress,
    registrarKey,
    pendingEmailSent,
    failedEmailSent,
  };
}

/**
 * Should we send the pending export email for this tick?
 *
 * Conditions:
 *  - Decision is PENDING_TRANSFER.
 *  - Email has not already been sent.
 *  - Evidence is trusted: DirectRegistrar reports positive_pending OR
 *    admin/client has approved the notification path.
 */
async function maybeSendPendingExportEmail(input: {
  decision: { action: TransferDecisionAction; reason: string };
  evidence: EvidenceSourceResult[];
  existingPendingSent: boolean;
  adminApproved: boolean;
  trackingRecordId: string;
  ownerAddress: string;
  domain: NamefiNormalizedDomain;
  registrarKey?: string;
}): Promise<boolean> {
  if (input.decision.action !== 'PENDING_TRANSFER') return false;
  if (input.existingPendingSent) return false;

  const directRegistrarTrust = hasSourceStatus(
    input.evidence,
    'DirectRegistrar',
    'positive_pending',
  );
  if (!directRegistrarTrust && !input.adminApproved) return false;

  try {
    const userId = await getUserIdFromOwnerAddress(input.ownerAddress);
    if (!userId) return false;
    const result = await sendPendingExportEmail({
      trackingRecordId: input.trackingRecordId,
      userId,
      domain: input.domain,
      registrarKey: input.registrarKey ?? 'unknown',
    });
    return result.sent;
  } catch (error) {
    logger.error(
      {
        domain: input.domain,
        trackingRecordId: input.trackingRecordId,
        error,
      },
      'Failed to send pending export email from tracking process',
    );
    return false;
  }
}

/**
 * Auto-send the failed export email after a registrar-confirmed
 * `TRANSFER_FAILED` transition. Wraps user-lookup and the per-row send
 * so the workflow caller has a single boolean to track.
 */
async function maybeSendFailedExportEmail(input: {
  trackingRecordId: string;
  ownerAddress: string;
  domain: NamefiNormalizedDomain;
  reason?: string;
}): Promise<boolean> {
  try {
    const userId = await getUserIdFromOwnerAddress(input.ownerAddress);
    if (!userId) return false;
    const result = await sendFailedExportEmail({
      trackingRecordId: input.trackingRecordId,
      userId,
      domain: input.domain,
      reason: input.reason,
    });
    return result.sent;
  } catch (error) {
    logger.error(
      {
        domain: input.domain,
        trackingRecordId: input.trackingRecordId,
        error,
      },
      'Failed to send failed-export email from tracking process',
    );
    return false;
  }
}

export async function getPendingTransferDomains(): Promise<
  Array<{
    id: string;
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
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
      ownerAddress: domainExportTrackingTable.ownerAddress,
      status: domainExportTrackingTable.status,
      statusHistory: domainExportTrackingTable.statusHistory,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        inArray(domainExportTrackingTable.status, transferWatchStatuses),
        eq(domainExportTrackingTable.isActive, true),
      ),
    );

  logger.debug({ count: records.length }, 'Found pending transfer domains');

  return records;
}

/**
 * Re-evaluate a row currently in PENDING_TRANSFER or TRANSFER_PERIOD.
 *
 * Outcomes:
 *  - `completed`     → transition to NEEDS_ADMIN_REVIEW (admin gate).
 *  - `failed`        → transition to TRANSFER_FAILED (terminal, isActive=false).
 *  - `still_pending` → update lastCheckedAt + evidence only.
 *  - `undetermined`  → update lastCheckedAt + evidence; status unchanged.
 */
export async function checkSinglePendingTransfer(input: {
  id: string;
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
  currentStatus: string;
  statusHistory: unknown;
}): Promise<{
  action: 'failed' | 'completed' | 'still_pending' | 'undetermined';
  newStatus?: string;
  domain?: NamefiNormalizedDomain;
  chainId?: number;
  failedEmailSent?: boolean;
}> {
  const { id, domain, chainId, ownerAddress, currentStatus, statusHistory } =
    input;
  const activityContext = Context.current();

  logger.debug({ domain, id }, 'Checking pending transfer');
  activityContext.heartbeat({ domain, step: 'rechecking' });

  const evidence = await gatherEvidenceForDomain({ domain });
  const decision = decideExportTrackingState(evidence);
  const evidenceCheckedAt = new Date();
  const latestEvidence = buildLatestEvidenceSnapshot({
    evidence,
    decision,
    checkedAt: evidenceCheckedAt,
  });
  const eppStatuses = getEppStatusesFromEvidence(evidence);
  const rdapData = getRdapDataFromEvidence(evidence);

  if (decision.action === 'UNDETERMINED') {
    await db
      .update(domainExportTrackingTable)
      .set({
        lastCheckedAt: evidenceCheckedAt,
        eppStatuses,
        whoisData: rdapData as Json,
        latestEvidence,
      })
      .where(eq(domainExportTrackingTable.id, id));
    return { action: 'undetermined' };
  }

  if (
    decision.action === 'PENDING_TRANSFER' ||
    decision.action === 'TRANSFER_PERIOD'
  ) {
    const statusFromDecision = actionToTrackingStatus(decision.action);

    if (statusFromDecision && statusFromDecision !== currentStatus) {
      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        statusHistory as ExportTrackingStatusHistoryEntry[] | null,
        statusFromDecision,
        {
          now,
          reason: decision.reason,
          evidence: { ...latestEvidence, actor: 'workflow' },
          eppStatuses,
        },
      );
      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: currentStatus as DomainExportTrackingStatus,
          status: statusFromDecision,
          statusHistory: updatedHistory,
          eppStatuses,
          whoisData: rdapData as Json,
          latestEvidence,
          statusChangedAt: now,
          lastCheckedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, id));
    } else {
      await db
        .update(domainExportTrackingTable)
        .set({
          lastCheckedAt: new Date(),
          eppStatuses,
          whoisData: rdapData as Json,
          latestEvidence,
        })
        .where(eq(domainExportTrackingTable.id, id));
    }

    return {
      action: 'still_pending',
      newStatus: statusFromDecision ?? undefined,
    };
  }

  if (decision.action === 'TRANSFER_FAILED') {
    const now = new Date();
    const updatedHistory = appendExportTrackingStatusHistory(
      statusHistory as ExportTrackingStatusHistoryEntry[] | null,
      'TRANSFER_FAILED',
      {
        now,
        reason: decision.reason,
        evidence: { ...latestEvidence, actor: 'workflow' },
        eppStatuses,
      },
    );
    await db
      .update(domainExportTrackingTable)
      .set({
        previousStatus: currentStatus as DomainExportTrackingStatus,
        status: 'TRANSFER_FAILED',
        statusHistory: updatedHistory,
        eppStatuses,
        whoisData: rdapData as Json,
        latestEvidence,
        statusChangedAt: now,
        lastCheckedAt: now,
        isActive: false,
      })
      .where(eq(domainExportTrackingTable.id, id));

    logger.debug({ domain }, 'Transfer failed (registrar-confirmed)');

    // Registrar-confirmed failure is high-trust; auto-send the failed
    // email. Heuristic "domain back in our account" path below does NOT
    // auto-send — admin can resend manually if desired.
    const failedEmailSent = await maybeSendFailedExportEmail({
      trackingRecordId: id,
      ownerAddress,
      domain,
      reason: decision.reason,
    });

    return {
      action: 'failed',
      newStatus: 'TRANSFER_FAILED',
      failedEmailSent,
    };
  }

  // NO_SIGNAL when the domain is back in our account is treated as a
  // failure: the previously-pending transfer didn't go through.
  if (decision.action === 'NO_SIGNAL') {
    const accountCheck = getEvidenceBy(evidence, 'AccountCheck');
    const stillInAccount = accountCheck?.status === 'negative';
    if (stillInAccount) {
      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        statusHistory as ExportTrackingStatusHistoryEntry[] | null,
        'TRANSFER_FAILED',
        {
          now,
          reason:
            'Heuristic: previously-pending transfer cleared and domain is back in our account — treating as failed transfer',
          evidence: { ...latestEvidence, actor: 'workflow' },
          eppStatuses,
        },
      );
      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: currentStatus as DomainExportTrackingStatus,
          status: 'TRANSFER_FAILED',
          statusHistory: updatedHistory,
          eppStatuses,
          whoisData: rdapData as Json,
          latestEvidence,
          statusChangedAt: now,
          lastCheckedAt: now,
          isActive: false,
        })
        .where(eq(domainExportTrackingTable.id, id));

      logger.debug({ domain }, 'Transfer failed: domain back in our account');
      return { action: 'failed', newStatus: 'TRANSFER_FAILED' };
    }
    // No signal but also not confirmed-in-account: just heartbeat.
    await db
      .update(domainExportTrackingTable)
      .set({
        lastCheckedAt: evidenceCheckedAt,
        eppStatuses,
        whoisData: rdapData as Json,
        latestEvidence,
      })
      .where(eq(domainExportTrackingTable.id, id));
    return { action: 'undetermined' };
  }

  // TRANSFER_COMPLETED decision: transition to NEEDS_ADMIN_REVIEW (admin gate).
  // Row stays active until admin acts.
  const now = new Date();
  const updatedHistory = appendExportTrackingStatusHistory(
    statusHistory as ExportTrackingStatusHistoryEntry[] | null,
    'NEEDS_ADMIN_REVIEW',
    {
      now,
      reason: decision.reason,
      evidence: { ...latestEvidence, actor: 'workflow' },
      eppStatuses,
    },
  );
  await db
    .update(domainExportTrackingTable)
    .set({
      previousStatus: currentStatus as DomainExportTrackingStatus,
      status: 'NEEDS_ADMIN_REVIEW',
      statusHistory: updatedHistory,
      eppStatuses,
      whoisData: rdapData as Json,
      latestEvidence,
      statusChangedAt: now,
      lastCheckedAt: now,
      transferCompletedAt: now,
      confirmedOutOfAccountAt: sql`COALESCE(${domainExportTrackingTable.confirmedOutOfAccountAt}, NOW())`,
    })
    .where(eq(domainExportTrackingTable.id, id));

  logger.debug({ domain }, 'Transfer completed — awaiting admin review');
  return {
    action: 'completed',
    newStatus: 'NEEDS_ADMIN_REVIEW',
    domain,
    chainId,
  };
}

// =====================================================================
// METRICS & REPORTING
// =====================================================================

export interface ExportTrackingReportMetrics {
  reportDate: Date;
  totalTracked: number;
  active: number;
  terminal: number;
  statusBreakdown: {
    noSignal: number;
    undetermined: number;
    pendingTransfer: number;
    transferPeriod: number;
    needsAdminReview: number;
    transferCompleted: number;
    resolved: number;
    transferFailed: number;
  };
  domains: Array<{
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
    status: string;
    previousStatus: string | null;
    isActive: boolean;
    statusChangedAt: Date;
    firstDetectedAt: Date;
    lastCheckedAt: Date;
    eppStatuses?: string[] | null;
    registrarKey?: string | null;
    statusHistory: unknown;
  }>;
}

export async function collectExportTrackingMetrics(): Promise<ExportTrackingReportMetrics> {
  logger.debug('Collecting export tracking metrics');

  const allRecords = await db
    .select({
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      ownerAddress: domainExportTrackingTable.ownerAddress,
      status: domainExportTrackingTable.status,
      previousStatus: domainExportTrackingTable.previousStatus,
      isActive: domainExportTrackingTable.isActive,
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
    transferCompleted: allRecords.filter(
      (r) => r.status === 'TRANSFER_COMPLETED',
    ).length,
    resolved: allRecords.filter((r) => r.status === 'RESOLVED').length,
    transferFailed: allRecords.filter((r) => r.status === 'TRANSFER_FAILED')
      .length,
  };

  return {
    reportDate: new Date(),
    totalTracked: allRecords.length,
    active: allRecords.filter((r) => r.isActive).length,
    terminal: allRecords.filter((r) => !r.isActive).length,
    statusBreakdown,
    domains: allRecords,
  };
}

function generateExportTrackingCSV(
  metrics: ExportTrackingReportMetrics,
): string {
  let csv =
    'Domain,Status,Previous Status,Active,Chain ID,Owner Address,Registrar,Status Changed At,First Detected At,Last Checked At,EPP Statuses\n';

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
    csv += `"${domain.domain}","${domain.status}","${domain.previousStatus || ''}",${domain.isActive},${domain.chainId},"${domain.ownerAddress}","${domain.registrarKey || ''}","${statusChangedAt}","${firstDetectedAt}","${lastCheckedAt}","${eppStatuses}"\n`;
  }

  return csv;
}

function generateExportTrackingJSON(
  metrics: ExportTrackingReportMetrics,
): string {
  const jsonData = {
    reportDate: format(metrics.reportDate, 'yyyy-MM-dd HH:mm:ss'),
    totalTracked: metrics.totalTracked,
    active: metrics.active,
    terminal: metrics.terminal,
    statusBreakdown: metrics.statusBreakdown,
    domains: metrics.domains.map((domain) => ({
      domain: domain.domain,
      status: domain.status,
      previousStatus: domain.previousStatus,
      isActive: domain.isActive,
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

export async function sendExportTrackingReportEmail(
  metrics: ExportTrackingReportMetrics,
): Promise<void> {
  logger.debug('Sending export tracking report email');

  try {
    const dateStr = format(metrics.reportDate, 'yyyy-MM-dd');
    const title = `📊 Domain Export Tracking Report - ${format(metrics.reportDate, 'MMM dd, yyyy')}`;

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
              <li><strong>Total Rows Tracked:</strong> ${metrics.totalTracked}</li>
              <li><strong>Active:</strong> ${metrics.active}</li>
              <li><strong>Terminal (frozen):</strong> ${metrics.terminal}</li>
              <li><span class="status-pending">Pending Transfer:</span> ${metrics.statusBreakdown.pendingTransfer}</li>
              <li><span class="status-period">Transfer Period (60-day lock):</span> ${metrics.statusBreakdown.transferPeriod}</li>
              <li><span class="status-completed">Needs Admin Review:</span> ${metrics.statusBreakdown.needsAdminReview}</li>
              <li><span class="status-completed">Transfer Completed:</span> ${metrics.statusBreakdown.transferCompleted}</li>
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
                <th>Active</th>
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
                <td>${domain.isActive ? 'yes' : 'no'}</td>
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
      content: { html: htmlContent },
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

// =====================================================================
// NOTIFICATIONS
//
// Each function writes per-email-type columns on the tracking row on both
// success and failure (attempt counters, lastAttemptAt, recipient,
// lastError). Callers don't need to write notification state themselves.
// =====================================================================

/**
 * Send the "domain export request detected" pending email.
 * Self-writes pending-email columns on the tracking row.
 */
export async function sendPendingExportEmail(input: {
  trackingRecordId: string;
  userId: string;
  domain: NamefiNormalizedDomain;
  registrarKey: string;
}): Promise<{ sent: boolean; recipient?: string; error?: string }> {
  const { trackingRecordId, userId, domain, registrarKey } = input;

  logger.debug(
    { userId, domain, registrarKey },
    'Sending pending export email',
  );

  const email = await maybeGetUserEmail(userId);
  if (!email) {
    const noRecipientError = `No deliverable email for userId=${userId} domain=${domain}`;
    logger.debug({ userId, domain }, 'No deliverable email for user');
    const now = new Date();
    await db
      .update(domainExportTrackingTable)
      .set({
        pendingExportEmailLastAttemptAt: now,
        pendingExportEmailAttempts: sql`${domainExportTrackingTable.pendingExportEmailAttempts} + 1`,
        pendingExportEmailLastError: noRecipientError,
        updatedAt: now,
      })
      .where(eq(domainExportTrackingTable.id, trackingRecordId));
    return { sent: false, error: noRecipientError };
  }

  const now = new Date();
  let sent = false;
  let errorMessage: string | undefined;

  try {
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
    sent = true;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      { trackingRecordId, domain, error },
      'Pending export email send failed',
    );
  }

  await db
    .update(domainExportTrackingTable)
    .set({
      pendingExportEmailLastAttemptAt: now,
      pendingExportEmailAttempts: sql`${domainExportTrackingTable.pendingExportEmailAttempts} + 1`,
      pendingExportEmailRecipient: email,
      ...(sent
        ? {
            pendingExportEmailSentAt: now,
            pendingExportEmailLastError: null,
          }
        : {
            pendingExportEmailLastError: errorMessage ?? null,
          }),
      updatedAt: now,
    })
    .where(eq(domainExportTrackingTable.id, trackingRecordId));

  if (sent) {
    logger.debug({ userId, domain, email }, 'Pending export email sent');
  }
  return { sent, recipient: email, error: errorMessage };
}

/**
 * Send the "domain export failed" notification. Self-writes failed-email
 * columns on the tracking row.
 */
export async function sendFailedExportEmail(input: {
  trackingRecordId: string;
  userId: string;
  domain: NamefiNormalizedDomain;
  reason?: string;
}): Promise<{ sent: boolean; recipient?: string; error?: string }> {
  const { trackingRecordId, userId, domain, reason } = input;

  logger.debug({ userId, domain, reason }, 'Sending export failed email');

  const email = await maybeGetUserEmail(userId);
  if (!email) {
    const noRecipientError = `No deliverable email for userId=${userId} domain=${domain}`;
    logger.debug({ userId, domain }, 'No deliverable email for user');
    const now = new Date();
    await db
      .update(domainExportTrackingTable)
      .set({
        failedExportEmailLastAttemptAt: now,
        failedExportEmailAttempts: sql`${domainExportTrackingTable.failedExportEmailAttempts} + 1`,
        failedExportEmailLastError: noRecipientError,
        updatedAt: now,
      })
      .where(eq(domainExportTrackingTable.id, trackingRecordId));
    return { sent: false, error: noRecipientError };
  }

  const now = new Date();
  let sent = false;
  let errorMessage: string | undefined;

  try {
    const html = await render(
      React.createElement(DomainExportFailed, {
        domainName: domain,
        recipientEmail: email,
        reason,
      } satisfies DomainExportFailedProps),
    );
    await sendMail({
      to: ENABLE_EXPORT_EMAILS ? [email] : EMAIL_BCC,
      bcc: EMAIL_BCC,
      subject: `Domain Export Did Not Complete: ${domain}`,
      content: { html },
    });
    sent = true;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      { trackingRecordId, domain, error },
      'Export failed email send failed',
    );
  }

  await db
    .update(domainExportTrackingTable)
    .set({
      failedExportEmailLastAttemptAt: now,
      failedExportEmailAttempts: sql`${domainExportTrackingTable.failedExportEmailAttempts} + 1`,
      failedExportEmailRecipient: email,
      ...(sent
        ? {
            failedExportEmailSentAt: now,
            failedExportEmailLastError: null,
          }
        : {
            failedExportEmailLastError: errorMessage ?? null,
          }),
      updatedAt: now,
    })
    .where(eq(domainExportTrackingTable.id, trackingRecordId));

  if (sent) {
    logger.debug({ userId, domain, email }, 'Export failed email sent');
  }
  return { sent, recipient: email, error: errorMessage };
}

/**
 * Send the "domain export completed" notification. Self-writes
 * completed-email columns on the tracking row.
 */
export async function sendExportCompleteEmail(input: {
  trackingRecordId: string;
  userId: string;
  domain: NamefiNormalizedDomain;
  chainId: number;
  nftBurnTxHash?: string;
}): Promise<{ sent: boolean; recipient?: string; error?: string }> {
  const { trackingRecordId, userId, domain, chainId, nftBurnTxHash } = input;

  logger.debug(
    { userId, domain, chainId, nftBurnTxHash },
    'Sending export complete email',
  );

  const email = await maybeGetUserEmail(userId);
  if (!email) {
    const noRecipientError = `No deliverable email for userId=${userId} domain=${domain}`;
    logger.debug({ userId, domain }, 'No deliverable email for user');
    const now = new Date();
    await db
      .update(domainExportTrackingTable)
      .set({
        completedExportEmailLastAttemptAt: now,
        completedExportEmailAttempts: sql`${domainExportTrackingTable.completedExportEmailAttempts} + 1`,
        completedExportEmailLastError: noRecipientError,
        updatedAt: now,
      })
      .where(eq(domainExportTrackingTable.id, trackingRecordId));
    return { sent: false, error: noRecipientError };
  }

  const now = new Date();
  let sent = false;
  let errorMessage: string | undefined;

  try {
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
    sent = true;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(
      { trackingRecordId, domain, error },
      'Export complete email send failed',
    );
  }

  await db
    .update(domainExportTrackingTable)
    .set({
      completedExportEmailLastAttemptAt: now,
      completedExportEmailAttempts: sql`${domainExportTrackingTable.completedExportEmailAttempts} + 1`,
      completedExportEmailRecipient: email,
      ...(sent
        ? {
            completedExportEmailSentAt: now,
            completedExportEmailLastError: null,
          }
        : {
            completedExportEmailLastError: errorMessage ?? null,
          }),
      updatedAt: now,
    })
    .where(eq(domainExportTrackingTable.id, trackingRecordId));

  if (sent) {
    logger.debug({ userId, domain, email }, 'Export complete email sent');
  }
  return { sent, recipient: email, error: errorMessage };
}

// =====================================================================
// NFT BURN
// =====================================================================

export type BurnEligibilityReason =
  | 'client_approved'
  | 'admin_approved'
  | 'time_confirmed'
  | 'not_eligible';

/**
 * Burn-eligibility predicate. Burns are allowed when:
 *   1. Client approved (`clientApprovedAt` is set).
 *   2. Admin approved (`verifyingAdminId` is set).
 *   3. Time confirmed (`confirmedOutOfAccountAt` > 36 hours ago).
 *
 * Filters by burn-eligible status but does NOT filter by `isActive` —
 * terminal `TRANSFER_COMPLETED` rows may legitimately still need burning.
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
      verifyingAdminId: domainExportTrackingTable.verifyingAdminId,
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
    .orderBy(sql`${domainExportTrackingTable.createdAt} DESC`)
    .limit(1);

  const record = records[0];

  if (!record) {
    return { shouldBurn: false, reason: 'not_eligible' };
  }

  if (record.nftBurnedAt) {
    return {
      shouldBurn: false,
      reason: 'not_eligible',
      trackingRecordId: record.id,
    };
  }

  if (!isBurnEligibleExportStatus(record.status)) {
    return {
      shouldBurn: false,
      reason: 'not_eligible',
      trackingRecordId: record.id,
    };
  }

  if (record.clientApprovedAt) {
    return {
      shouldBurn: true,
      reason: 'client_approved',
      trackingRecordId: record.id,
    };
  }

  if (record.verifyingAdminId) {
    return {
      shouldBurn: true,
      reason: 'admin_approved',
      trackingRecordId: record.id,
    };
  }

  if (record.confirmedOutOfAccountAt) {
    const hoursOutOfAccount = differenceInHours(
      new Date(),
      record.confirmedOutOfAccountAt,
    );
    if (hoursOutOfAccount >= MIN_HOURS_FOR_TIME_BASED_BURN) {
      return {
        shouldBurn: true,
        reason: 'time_confirmed',
        trackingRecordId: record.id,
      };
    }
  }

  return {
    shouldBurn: false,
    reason: 'not_eligible',
    trackingRecordId: record.id,
  };
}

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
      verifyingAdminId: domainExportTrackingTable.verifyingAdminId,
      confirmedOutOfAccountAt:
        domainExportTrackingTable.confirmedOutOfAccountAt,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        inArray(domainExportTrackingTable.status, [
          ...EXPORT_BURN_ELIGIBLE_STATUSES,
        ]),
        isNull(domainExportTrackingTable.nftBurnedAt),
        inArray(domainExportTrackingTable.chainId, allowedChains),
      ),
    );

  return records;
}

/**
 * Record the result of an NFT burn operation. On success, transitions the
 * row to RESOLVED (terminal) and flips isActive=false.
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
    // Burn-eligible rows include admin-verified TRANSFER_COMPLETED rows
    // (already terminal, isActive=false). Look up the most-recent
    // unburned row for this (domain, chain) pair instead of filtering by
    // isActive — otherwise a successful burn on a verified row would
    // update nothing and the workflow would pick it up again next tick.
    const existingRecord = await db
      .select({
        id: domainExportTrackingTable.id,
        statusHistory: domainExportTrackingTable.statusHistory,
      })
      .from(domainExportTrackingTable)
      .where(
        and(
          eq(domainExportTrackingTable.normalizedDomainName, domain),
          eq(domainExportTrackingTable.chainId, chainId),
          isNull(domainExportTrackingTable.nftBurnedAt),
        ),
      )
      .orderBy(sql`${domainExportTrackingTable.createdAt} DESC`)
      .limit(1);

    const record = existingRecord[0];
    if (!record) {
      logger.warn(
        { domain, chainId, txHash },
        'No unburned export-tracking row found for successful NFT burn',
      );
      return;
    }

    const updatedHistory = appendExportTrackingStatusHistory(
      (record.statusHistory as ExportTrackingStatusHistoryEntry[] | null) ?? [],
      'RESOLVED',
      {
        reason: `NFT burn confirmed (tx ${txHash}); marking export tracking as resolved.`,
        evidence: {
          actor: 'system',
          checkedAt: new Date().toISOString(),
          decisionAction: 'RESOLVED',
          decisionReason: 'NFT burn transaction landed on-chain',
        },
      },
    );

    await db
      .update(domainExportTrackingTable)
      .set({
        previousStatus: sql`${domainExportTrackingTable.status}`,
        status: 'RESOLVED',
        statusHistory: updatedHistory,
        nftBurnedAt: new Date(),
        nftBurnTxHash: txHash,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(domainExportTrackingTable.id, record.id));
    logger.debug({ domain, chainId, txHash }, 'Recorded successful NFT burn');
  } else if (error) {
    logger.error({ domain, chainId, error }, 'NFT burn failed');
  }
}

// =====================================================================
// USER LOOKUP
// =====================================================================

/**
 * Look up the internal user id given an on-chain wallet address. Resolves
 * via Privy (wallet → privy user id) then `users.privyUserId`.
 */
export async function getUserIdFromOwnerAddress(
  ownerAddress: string,
): Promise<string | null> {
  const { usersTable } = await import('@namefi-astra/db');

  const privyUser = await privyClient.getUserByWalletAddress(ownerAddress);
  if (!privyUser) {
    logger.debug({ ownerAddress }, 'No Privy user found for wallet address');
    return null;
  }

  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.privyUserId, privyUser.id))
    .limit(1);

  return users[0]?.id || null;
}
