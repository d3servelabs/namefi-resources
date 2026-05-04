/**
 * DNSViz daily digest workflow.
 *
 * Triggered by `apps/backend/src/temporal/schedules/dnsviz-daily-digest.ts`
 * every day at 04:00 UTC. Walks every active indexed domain, runs
 * `dnsviz probe` + `dnsviz grok`, persists the result + a derived validation
 * status to the `dnsviz_analyses` table, and emails ops a digest table
 * (Domain | Status | Registrar | Reasoning) covering all four statuses.
 * The Reasoning column shows the parser's decision for every row so a
 * wrong verdict is visible at a glance.
 *
 * Batch sizing trade-offs (defaults: batchSize=50, perDomainConcurrency=3):
 *   probe ≈ 30s/domain → 17 sequential rounds × 35s ≈ 10 min/batch.
 *   1k active domains ≈ 20 batches × 10 min ≈ 3.5h. Workflow timeout is set
 *   to 12h on the schedule so we have margin up to ~3k domains.
 *
 * Re-runs are idempotent: the activity upserts on `(domain, analysisDate)`.
 */
import * as workflow from '@temporalio/workflow';
import { longRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { runDnsvizAnalysisWithRetries } from './dnsviz-retry';

const {
  getActiveDomainsForDnsviz,
  analyzeDomainsBatch,
  sendDnsvizDigestEmail,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...longRunningOpts,
    startToCloseTimeout: '45m',
  },
});

export interface DnsvizDailyDigestWorkflowInput {
  /** Number of domains analyzed per activity invocation. Default 50. */
  batchSize?: number;
  /** Parallel dnsviz probes inside one batch. Default 3. */
  perDomainConcurrency?: number;
  /** Days before a row's `expires_at` lands. Default 30. */
  retentionDays?: number;
  /** Optional safety cap (the daily run normally processes everything). */
  maxDomains?: number;
  /**
   * Seconds to wait between successive batches. Defaults to 30s to give
   * authoritative DNS servers a breather — running back-to-back batches
   * was tripping rate limits in the deployed environment. Set to 0 to
   * disable.
   */
  delayBetweenBatchesSeconds?: number;
  /** When true, persist analyses but skip sending the digest email. */
  skipDigestEmail?: boolean;
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

export interface DnsvizDailyDigestWorkflowOutput {
  totalDomains: number;
  secure: number;
  insecure: number;
  bogus: number;
  error: number;
  emailSent: boolean;
  /**
   * Total rows referenced by the digest email. May exceed `totalDomains`
   * if a previous on-demand run on the same `analysisDate` upserted other
   * rows that the digest query then picked up.
   */
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
const DEFAULT_MAX_ERROR_RETRIES = 3;
const DEFAULT_MAX_BOGUS_RETRIES = 1;

export async function dnsvizDailyDigestWorkflow({
  batchSize = DEFAULT_BATCH_SIZE,
  perDomainConcurrency = DEFAULT_PER_DOMAIN_CONCURRENCY,
  retentionDays = DEFAULT_RETENTION_DAYS,
  maxDomains,
  delayBetweenBatchesSeconds = DEFAULT_DELAY_BETWEEN_BATCHES_SECONDS,
  skipDigestEmail = false,
  maxErrorRetries = DEFAULT_MAX_ERROR_RETRIES,
  maxBogusRetries = DEFAULT_MAX_BOGUS_RETRIES,
}: DnsvizDailyDigestWorkflowInput = {}): Promise<DnsvizDailyDigestWorkflowOutput> {
  const startTime = Date.now();
  const info = workflow.workflowInfo();
  const analysisDate = toUtcDate(info.startTime);

  workflow.log.info('Starting DNSViz daily digest', {
    analysisDate,
    batchSize,
    perDomainConcurrency,
    retentionDays,
    maxDomains: maxDomains ?? null,
    maxErrorRetries,
    maxBogusRetries,
  });

  const allDomains = await getActiveDomainsForDnsviz();
  const cappedDomains =
    typeof maxDomains === 'number' && maxDomains > 0
      ? allDomains.slice(0, maxDomains)
      : allDomains;

  // Deterministic shuffle by hash of the domain name. Spreads same-TLD
  // domains across batches so consecutive batches don't all hit one
  // authoritative server, while keeping replays reproducible.
  const orderedDomains = [...cappedDomains].sort(
    (a, b) => djb2(a.domainName) - djb2(b.domainName),
  );

  if (orderedDomains.length === 0) {
    workflow.log.warn('No active domains to analyze; finishing early');
    return finalize({
      totals: { secure: 0, insecure: 0, bogus: 0, error: 0, processed: 0 },
      emailSent: false,
      emailRowCount: 0,
      emailIssueCount: 0,
      analysisDate,
      startTime,
    });
  }

  const totals = await runDnsvizAnalysisWithRetries({
    domains: orderedDomains,
    analysisDate,
    retentionDays,
    workflowRunId: info.runId,
    perDomainConcurrency,
    batchSize,
    delayBetweenBatchesSeconds,
    maxErrorRetries,
    maxBogusRetries,
    logPrefix: 'dnsviz daily',
    analyzeDomainsBatch,
  });

  let emailSent = false;
  let emailRowCount = 0;
  let emailIssueCount = 0;
  if (!skipDigestEmail) {
    const emailResult = await catchAndAlertLocally(
      () =>
        sendDnsvizDigestEmail({
          analysisDate,
          workflowRunId: info.runId,
          subjectPrefix: '[DNSViz daily]',
        }),
      {
        message: 'dnsviz digest email failed',
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
}): DnsvizDailyDigestWorkflowOutput {
  const out: DnsvizDailyDigestWorkflowOutput = {
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
  workflow.log.info('DNSViz daily digest complete', { ...out });
  return out;
}

function toUtcDate(d: Date): string {
  // ISO `YYYY-MM-DD` for the workflow's start time, in UTC.
  return d.toISOString().slice(0, 10);
}

/**
 * djb2 hash https://en.wikipedia.org/wiki/Daniel_J._Bernstein
 * @param s
 * @returns
 */
function djb2(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}
