/**
 * DNSViz on-demand workflow.
 *
 * Same shape as `dnsvizDailyDigestWorkflow`, but takes an explicit list of
 * domain names instead of pulling every active domain from
 * `indexed_domains`. Useful for:
 *   - manually re-checking a domain after a DNSSEC fix without waiting for
 *     04:00 UTC,
 *   - poking a list of test domains during development,
 *   - backfilling a missed `analysisDate` for a known-suspect set,
 *   - probing third-party domains we don't manage (e.g. comparing our
 *     setup against a reference SECURE zone).
 *
 * Domains do NOT need to exist in `indexed_domains`. For each input domain
 * we look up its `registrar_key` in `indexed_domains`; misses fall back to
 * `fallbackRegistrarKey` (default `AD_HOC`). The `dnsviz_analyses` table
 * has no FK to `indexed_domains`, so any FQDN works.
 *
 * Not on a schedule — invoke directly with the Temporal client:
 *
 *   await temporalClient.workflow.execute(dnsvizOnDemandWorkflow, {
 *     workflowId: `dnsviz-on-demand-${Date.now()}`,
 *     taskQueue: TEMPORAL_QUEUES.INDEXERS,
 *     args: [{ domains: ['samyx.net', 'cloudflare.com', 'paypal.com'] }],
 *   });
 *
 * Persists rows to the same `dnsviz_analyses` table; ON CONFLICT (domain,
 * analysis_date) means re-running for the same day overwrites — including
 * stomping the daily run's row if both fire on the same date. That's
 * intentional ("most recent analysis wins per day").
 */
import * as workflow from '@temporalio/workflow';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { longRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { runDnsvizAnalysisWithRetries } from './dnsviz-retry';

const {
  getRegistrarKeysForDomains,
  analyzeDomainsBatch,
  sendDnsvizDigestEmail,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...longRunningOpts,
    startToCloseTimeout: '45m',
  },
});

export interface DnsvizOnDemandWorkflowInput {
  /**
   * Domain names to analyze. Lowercased + trimmed, trailing dot stripped,
   * duplicates dropped before processing. Required.
   */
  domains: string[];
  /** Domains analyzed per activity invocation. Default 50. */
  batchSize?: number;
  /** Parallel dnsviz probes inside one batch. Default 3. */
  perDomainConcurrency?: number;
  /** Days before each row's `expires_at`. Default 30. */
  retentionDays?: number;
  /**
   * Override `analysis_date` (`YYYY-MM-DD` UTC). Defaults to the workflow's
   * start date. Useful for backfilling a specific past day.
   */
  analysisDate?: string;
  /**
   * When true, sends a digest email at the end (covering this run's domains
   * only, by passing `domainFilter`). The email lists every domain in the
   * input by status, not just BOGUS/ERROR. Default false — interactive
   * runs typically don't want to page anyone.
   */
  sendDigestEmail?: boolean;
  /**
   * Seconds to wait between successive batches. Defaults to 30s to give
   * authoritative DNS servers a breather — running back-to-back batches
   * was tripping rate limits in the deployed environment. Set to 0 to
   * disable (useful for tiny on-demand runs of a few domains).
   */
  delayBetweenBatchesSeconds?: number;
  /**
   * Used as `registrar_key` for any input domain that isn't found in
   * `indexed_domains`. Default `AD_HOC`.
   */
  fallbackRegistrarKey?: string;
  /**
   * How many retry rounds an `ERROR` domain gets before we give up. ERRORs
   * are typically transient (probe/grok failure, network blip, rate limit)
   * so this defaults to 3 — total attempts up to 4 (initial + 3 retries).
   */
  maxErrorRetries?: number;
  /**
   * How many retry rounds a `BOGUS` domain gets. BOGUS means DNSSEC is
   * misconfigured per dnsviz; most are persistent, but key-roll and stale-
   * signer windows clear within minutes, so we retry once by default.
   */
  maxBogusRetries?: number;
}

export interface DnsvizOnDemandWorkflowOutput {
  /** Number of domains in the input array. */
  domainsRequested: number;
  /** After normalization + dedupe. */
  domainsValid: number;
  /** Domains for which an analysis row was actually written. */
  totalDomains: number;
  secure: number;
  insecure: number;
  bogus: number;
  error: number;
  emailSent: boolean;
  /** Total rows referenced by the digest email (scoped to this run's input). */
  emailRowCount: number;
  /** BOGUS + ERROR count covered by the digest email. */
  emailIssueCount: number;
  workflowExecutionTimeMs: number;
  analysisDate: string;
}

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_PER_DOMAIN_CONCURRENCY = 5;
const DEFAULT_RETENTION_DAYS = 7;
const DEFAULT_DELAY_BETWEEN_BATCHES_SECONDS = 15;
const DEFAULT_FALLBACK_REGISTRAR_KEY = 'AD_HOC';
const DEFAULT_MAX_ERROR_RETRIES = 3;
const DEFAULT_MAX_BOGUS_RETRIES = 1;

export async function dnsvizOnDemandWorkflow({
  domains,
  batchSize = DEFAULT_BATCH_SIZE,
  perDomainConcurrency = DEFAULT_PER_DOMAIN_CONCURRENCY,
  retentionDays = DEFAULT_RETENTION_DAYS,
  analysisDate: analysisDateOverride,
  sendDigestEmail = false,
  delayBetweenBatchesSeconds = DEFAULT_DELAY_BETWEEN_BATCHES_SECONDS,
  fallbackRegistrarKey = DEFAULT_FALLBACK_REGISTRAR_KEY,
  maxErrorRetries = DEFAULT_MAX_ERROR_RETRIES,
  maxBogusRetries = DEFAULT_MAX_BOGUS_RETRIES,
}: DnsvizOnDemandWorkflowInput): Promise<DnsvizOnDemandWorkflowOutput> {
  const startTime = Date.now();
  const info = workflow.workflowInfo();
  const analysisDate = analysisDateOverride ?? toUtcDate(info.startTime);

  const normalized = normalizeDomains(domains);

  workflow.log.info('Starting DNSViz on-demand', {
    analysisDate,
    domainsRequested: domains.length,
    domainsValid: normalized.length,
    batchSize,
    perDomainConcurrency,
    retentionDays,
    maxErrorRetries,
    maxBogusRetries,
  });

  if (normalized.length === 0) {
    workflow.log.warn('No valid domains supplied; finishing early');
    return finalize({
      totals: { secure: 0, insecure: 0, bogus: 0, error: 0, processed: 0 },
      emailSent: false,
      emailRowCount: 0,
      emailIssueCount: 0,
      analysisDate,
      startTime,
      domainsRequested: domains.length,
      domainsValid: 0,
    });
  }

  const registrarKeys = await getRegistrarKeysForDomains({
    domains: normalized,
  });
  const enriched = normalized.map((d) => ({
    domainName: d as NamefiNormalizedDomain,
    registrarKey: registrarKeys[d] ?? fallbackRegistrarKey,
  }));

  const totals = await runDnsvizAnalysisWithRetries({
    domains: enriched,
    analysisDate,
    retentionDays,
    workflowRunId: info.runId,
    perDomainConcurrency,
    batchSize,
    delayBetweenBatchesSeconds,
    maxErrorRetries,
    maxBogusRetries,
    logPrefix: 'dnsviz on-demand',
    analyzeDomainsBatch,
  });

  let emailSent = false;
  let emailRowCount = 0;
  let emailIssueCount = 0;
  if (sendDigestEmail) {
    const emailResult = await catchAndAlertLocally(
      () =>
        sendDnsvizDigestEmail({
          analysisDate,
          workflowRunId: info.runId,
          // Scope the digest to THIS run's input so the email doesn't
          // mix in unrelated rows from a same-day daily run.
          domainFilter: normalized,
          subjectPrefix: '[DNSViz on-demand]',
        }),
      {
        message: 'dnsviz on-demand digest email failed',
        details: { analysisDate },
      },
    );
    if (emailResult) {
      emailSent = emailResult.sent;
      emailRowCount = emailResult.totalRows;
      emailIssueCount = emailResult.bogusCount + emailResult.errorCount;
    }
  }

  return finalize({
    totals,
    emailSent,
    emailRowCount,
    emailIssueCount,
    analysisDate,
    startTime,
    domainsRequested: domains.length,
    domainsValid: normalized.length,
  });
}

function finalize(args: {
  totals: {
    secure: number;
    insecure: number;
    bogus: number;
    error: number;
    processed: number;
  };
  emailSent: boolean;
  emailRowCount: number;
  emailIssueCount: number;
  analysisDate: string;
  startTime: number;
  domainsRequested: number;
  domainsValid: number;
}): DnsvizOnDemandWorkflowOutput {
  const out: DnsvizOnDemandWorkflowOutput = {
    domainsRequested: args.domainsRequested,
    domainsValid: args.domainsValid,
    totalDomains: args.totals.processed,
    secure: args.totals.secure,
    insecure: args.totals.insecure,
    bogus: args.totals.bogus,
    error: args.totals.error,
    emailSent: args.emailSent,
    emailRowCount: args.emailRowCount,
    emailIssueCount: args.emailIssueCount,
    workflowExecutionTimeMs: Date.now() - args.startTime,
    analysisDate: args.analysisDate,
  };
  workflow.log.info('DNSViz on-demand complete', { ...out });
  return out;
}

/**
 * Lowercase + trim + drop trailing dot + dedupe. Anything left empty after
 * trimming is dropped silently — caller's `domainsRequested` vs
 * `domainsValid` in the output makes this visible.
 */
function normalizeDomains(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) continue;
    const noTrailing = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
    if (!noTrailing || seen.has(noTrailing)) continue;
    seen.add(noTrailing);
    out.push(noTrailing);
  }
  return out;
}

function toUtcDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
