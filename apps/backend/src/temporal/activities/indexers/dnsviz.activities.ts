/**
 * Activities backing the DNSViz daily-digest, on-demand, and cleanup
 * workflows.
 *
 * - getActiveDomainsForDnsviz     reads indexed_domains for non-expired SLDs
 * - getRegistrarKeysForDomains    looks up registrar_key by domain name
 *                                 (used by the on-demand workflow to enrich
 *                                 caller-supplied lists)
 * - analyzeDomainsBatch           probes + groks each domain in parallel,
 *                                 upserts dnsviz_analyses rows
 * - sendDnsvizDigestEmail         emails ops a digest table with
 *                                 Domain | Status | Registrar | Reasoning
 *                                 columns. Sorts BOGUS → ERROR → WARN →
 *                                 INSECURE → EXPECTED_ERROR → SECURE
 *                                 (worst-first); status uses the same
 *                                 reclassification overlay as the admin
 *                                 UI (see `dnsvizEffectiveStatusSql`).
 *                                 In unscoped/daily mode the SECURE and
 *                                 EXPECTED_ERROR tails are truncated to
 *                                 keep email size bounded.
 * - deleteExpiredDnsvizAnalyses   prunes rows past expires_at, used by the
 *                                 cleanup workflow
 *
 * Activities are registered to the INDEXERS task queue alongside the other
 * domain-index activities (see ./index.ts).
 */

import { Context } from '@temporalio/activity';
import { and, asc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import pMap from 'p-map';
import { db as database } from '@namefi-astra/db';
import {
  dnsvizAnalysesTable,
  indexedDomainsTable,
  // Raw 4-value enum on `dnsviz_analyses.status` (used for batch
  // results / persistence). The digest email surfaces the wider
  // *effective* enum via `DnsvizEffectiveStatus` below.
  type DnsvizAnalysisStatus,
  type DnsvizAnalysisSummary,
} from '@namefi-astra/db/schema';
import type { DnsvizAnalysisStatus as DnsvizEffectiveStatus } from '@namefi-astra/common/contract/admin/admin-dnsviz-contract';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { createLogger } from '#lib/logger';
import {
  DnsvizError,
  deriveDnsvizStatus,
  runDnsvizGrok,
  runDnsvizProbe,
} from '#lib/dnsviz';
import { dnsvizEffectiveStatusSql } from '#lib/dnsviz-effective-status-sql';
import { sendMail } from '../../../mail/mail-client';

const logger = createLogger({ module: 'dnsviz-activities' });

/**
 * "Active" = present at a registrar AND not yet expired. The hourly
 * `updateDomainIndexWorkflow` is the source of truth for what's present.
 */
export async function getActiveDomainsForDnsviz(): Promise<
  Array<{
    domainName: NamefiNormalizedDomain;
    registrarKey: string;
  }>
> {
  const rows = await database
    .select({
      domainName: indexedDomainsTable.normalizedDomainName,
      registrarKey: indexedDomainsTable.registrarKey,
    })
    .from(indexedDomainsTable)
    .where(
      and(
        eq(indexedDomainsTable.isMissingFromRegistrar, false),
        gt(indexedDomainsTable.expirationTime, new Date()),
      ),
    );

  logger.debug({ count: rows.length }, 'fetched active domains for dnsviz');
  return rows;
}

export interface GetRegistrarKeysForDomainsInput {
  domains: string[];
}

/**
 * For each normalized domain in the input list, look up its `registrar_key`
 * from `indexed_domains`. Returns a `domainName → registrarKey` map; domains
 * not present in the index are simply omitted (callers can fall back to a
 * placeholder). Used by the on-demand workflow to enrich a caller-provided
 * list before invoking `analyzeDomainsBatch`.
 */
export async function getRegistrarKeysForDomains(
  input: GetRegistrarKeysForDomainsInput,
): Promise<Record<string, string>> {
  if (input.domains.length === 0) return {};
  const rows = await database
    .select({
      domainName: indexedDomainsTable.normalizedDomainName,
      registrarKey: indexedDomainsTable.registrarKey,
    })
    .from(indexedDomainsTable)
    .where(
      inArray(
        indexedDomainsTable.normalizedDomainName,
        input.domains as NamefiNormalizedDomain[],
      ),
    );
  const out: Record<string, string> = {};
  for (const r of rows) {
    out[r.domainName] = r.registrarKey;
  }
  return out;
}

export interface AnalyzeDomainsBatchInput {
  domains: Array<{
    domainName: NamefiNormalizedDomain;
    registrarKey: string;
  }>;
  /** UTC date string `YYYY-MM-DD` — used as the unique-per-day key. */
  analysisDate: string;
  retentionDays: number;
  workflowRunId: string;
  perDomainConcurrency: number;
}

export interface AnalyzeDomainsBatchResult {
  processed: number;
  secure: number;
  insecure: number;
  bogus: number;
  error: number;
  /**
   * Domains that ended up with `status=ERROR` after this batch (probe/grok
   * failure or malformed grok output). The workflow can hand these back
   * into `analyzeDomainsBatch` for a retry; ON CONFLICT will overwrite the
   * original ERROR rows with whatever verdict the retry produces.
   */
  erroredDomains: Array<{
    domainName: NamefiNormalizedDomain;
    registrarKey: string;
  }>;
  /**
   * Domains that ended up with `status=BOGUS` after this batch (DNSSEC
   * misconfigured per dnsviz). BOGUS is sometimes transient (mid-key-roll,
   * stale signers) so the workflow may retry these too.
   */
  bogusDomains: Array<{
    domainName: NamefiNormalizedDomain;
    registrarKey: string;
  }>;
  /**
   * Final status of every domain in the input, in the same order. The
   * workflow uses this map to drive its retry queues and to compute final
   * SECURE/INSECURE/BOGUS/ERROR totals after all retry rounds without
   * having to re-query the DB.
   */
  domainResults: Array<{
    domainName: NamefiNormalizedDomain;
    registrarKey: string;
    status: DnsvizAnalysisStatus;
  }>;
}

/**
 * For each domain in the batch, in parallel up to `perDomainConcurrency`:
 *
 *   1. `dnsviz probe` → JSON
 *   2. `dnsviz grok -l info -c` → JSON
 *   3. derive status + summary
 *   4. INSERT INTO dnsviz_analyses ... ON CONFLICT (domain, date) DO UPDATE
 *
 * Per-domain failures are stored as `status = ERROR` rows; only batch-level
 * exceptions (DB outage, unhandled bug) propagate out of this activity.
 * Heartbeats fire at each phase to prevent Temporal from declaring the
 * activity dead during a long batch.
 */
export async function analyzeDomainsBatch(
  input: AnalyzeDomainsBatchInput,
): Promise<AnalyzeDomainsBatchResult> {
  const ctx = Context.current();
  const counts: AnalyzeDomainsBatchResult = {
    processed: 0,
    secure: 0,
    insecure: 0,
    bogus: 0,
    error: 0,
    erroredDomains: [],
    bogusDomains: [],
    domainResults: [],
  };
  const expiresAt = computeExpiresAt(input.analysisDate, input.retentionDays);

  await pMap(
    input.domains,
    async (target, index) => {
      ctx.heartbeat({ stage: 'start', domain: target.domainName });
      const startedAt = new Date();
      let status: DnsvizAnalysisStatus = 'ERROR';
      let errorsCount = 0;
      let warningsCount = 0;
      let summary: DnsvizAnalysisSummary | null = null;
      let probeData: unknown = null;
      let grokData: unknown = null;
      let errorMessage: string | null = null;

      try {
        probeData = await runDnsvizProbe(target.domainName, { index });
        ctx.heartbeat({ stage: 'probed', domain: target.domainName });
        grokData = await runDnsvizGrok(probeData);
        ctx.heartbeat({ stage: 'grokked', domain: target.domainName });
        const derived = deriveDnsvizStatus(grokData, target.domainName);
        status = derived.status;
        errorsCount = derived.errorsCount;
        warningsCount = derived.warningsCount;
        summary = derived.summary;
        if (status === 'ERROR' && summary.topErrors[0]) {
          errorMessage = summary.topErrors[0].slice(0, 1000);
        }
      } catch (err) {
        errorMessage = formatErrorMessage(err);
        logger.warn(
          { domain: target.domainName, error: errorMessage },
          'dnsviz probe/grok failed for %s',
          target.domainName,
        );
      }

      const durationMs = Date.now() - startedAt.getTime();

      try {
        await database
          .insert(dnsvizAnalysesTable)
          .values({
            normalizedDomainName: target.domainName,
            registrarKey: target.registrarKey,
            analysisDate: input.analysisDate,
            analysisStartedAt: startedAt,
            durationMs,
            status,
            errorsCount,
            warningsCount,
            summary,
            probeData,
            grokData,
            errorMessage,
            workflowRunId: input.workflowRunId,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: [
              dnsvizAnalysesTable.normalizedDomainName,
              dnsvizAnalysesTable.analysisDate,
            ],
            set: {
              registrarKey: sql.raw('EXCLUDED.registrar_key'),
              analysisStartedAt: sql.raw('EXCLUDED.analysis_started_at'),
              durationMs: sql.raw('EXCLUDED.duration_ms'),
              status: sql.raw('EXCLUDED.status'),
              errorsCount: sql.raw('EXCLUDED.errors_count'),
              warningsCount: sql.raw('EXCLUDED.warnings_count'),
              summary: sql.raw('EXCLUDED.summary'),
              probeData: sql.raw('EXCLUDED.probe_data'),
              grokData: sql.raw('EXCLUDED.grok_data'),
              errorMessage: sql.raw('EXCLUDED.error_message'),
              workflowRunId: sql.raw('EXCLUDED.workflow_run_id'),
              expiresAt: sql.raw('EXCLUDED.expires_at'),
              updatedAt: new Date(),
            },
          });
      } catch (dbErr) {
        // Persist failure shouldn't poison sibling rows in the batch.
        logger.error(
          { domain: target.domainName, error: dbErr },
          'failed to persist dnsviz analysis row',
        );
      }

      counts.processed++;
      counts[statusToCountKey(status)]++;
      if (status === 'ERROR') {
        counts.erroredDomains.push({
          domainName: target.domainName,
          registrarKey: target.registrarKey,
        });
      } else if (status === 'BOGUS') {
        counts.bogusDomains.push({
          domainName: target.domainName,
          registrarKey: target.registrarKey,
        });
      }
      counts.domainResults.push({
        domainName: target.domainName,
        registrarKey: target.registrarKey,
        status,
      });
      ctx.heartbeat({ stage: 'persisted', domain: target.domainName, status });
    },
    { concurrency: Math.max(1, input.perDomainConcurrency) },
  );

  return counts;
}

export interface SendDnsvizDigestEmailInput {
  /** YYYY-MM-DD UTC date, matches the `analysisDate` column. */
  analysisDate: string;
  workflowRunId: string;
  /**
   * Optional subset of domains to include in the digest. When set (e.g. by
   * the on-demand workflow), the email lists every domain in the subset by
   * name across all status sections. When unset (daily-digest mode), the
   * email shows full detail only for BOGUS/ERROR; SECURE is reported as a
   * count and INSECURE as a count + truncated list.
   */
  domainFilter?: string[];
  /** Subject-line prefix. Default `[DNSViz]`. */
  subjectPrefix?: string;
}

export interface SendDnsvizDigestEmailResult {
  sent: boolean;
  totalRows: number;
  // Counts mirror `DigestCounts` (effective-status buckets after the
  // reclassification overlay). See `dnsvizEffectiveStatusSql` for the
  // overlay rules.
  secureCount: number;
  insecureCount: number;
  bogusCount: number;
  errorCount: number;
  expectedErrorCount: number;
  warnCount: number;
}

const DIGEST_LIST_TRUNCATE = 50;

/**
 * Send the DNSViz digest email — a summary across all four statuses for
 * `analysisDate`, with full per-row detail for BOGUS + ERROR and aggregate
 * counts (+ truncated lists) for SECURE / INSECURE. No-op when the query
 * returns zero rows.
 *
 * Used by both `dnsvizDailyDigestWorkflow` and `dnsvizOnDemandWorkflow`;
 * the on-demand caller passes `domainFilter` to scope the report to its
 * explicit input list (otherwise the email would mix in all rows for the
 * same `analysisDate` from a previous daily run).
 */
export async function sendDnsvizDigestEmail(
  input: SendDnsvizDigestEmailInput,
): Promise<SendDnsvizDigestEmailResult> {
  const whereClauses = [
    eq(dnsvizAnalysesTable.analysisDate, input.analysisDate),
  ];
  if (input.domainFilter && input.domainFilter.length > 0) {
    whereClauses.push(
      inArray(
        dnsvizAnalysesTable.normalizedDomainName,
        input.domainFilter as NamefiNormalizedDomain[],
      ),
    );
  }

  // LEFT JOIN `indexed_domains` so the shared
  // `dnsvizEffectiveStatusSql` overlay (same one powering the admin UI)
  // can read `nameservers` + `dnssec_status` to reclassify rows. The
  // join is on `(normalized_domain_name, registrar_key)` mirroring the
  // dnsviz_analyses unique key; ad-hoc third-party domains run via the
  // on-demand workflow have no `indexed_domains` match and pass
  // through with the raw status (CASE evaluates the indexed columns
  // as NULL → all reclassification predicates fail).
  const dbRows = await database
    .select({
      id: dnsvizAnalysesTable.id,
      domainName: dnsvizAnalysesTable.normalizedDomainName,
      registrarKey: dnsvizAnalysesTable.registrarKey,
      status: dnsvizEffectiveStatusSql.as('effective_status'),
      // Raw status drives `formatStatusReasoning` (the per-row
      // explanation reads from the underlying grok verdict, not the
      // reclassification overlay).
      rawStatus: dnsvizAnalysesTable.status,
      summary: dnsvizAnalysesTable.summary,
      errorMessage: dnsvizAnalysesTable.errorMessage,
    })
    .from(dnsvizAnalysesTable)
    .leftJoin(
      indexedDomainsTable,
      and(
        eq(
          indexedDomainsTable.normalizedDomainName,
          dnsvizAnalysesTable.normalizedDomainName,
        ),
        eq(indexedDomainsTable.registrarKey, dnsvizAnalysesTable.registrarKey),
      ),
    )
    .where(and(...whereClauses))
    .orderBy(asc(dnsvizAnalysesTable.normalizedDomainName));

  const rows: DigestRow[] = dbRows.map((r) => ({
    ...r,
    // SQL `CASE` returns text; cast to the wider enum.
    status: r.status as DnsvizEffectiveStatus,
  }));

  const counts: DigestCounts = {
    secureCount: 0,
    insecureCount: 0,
    bogusCount: 0,
    errorCount: 0,
    expectedErrorCount: 0,
    warnCount: 0,
  };
  for (const r of rows) {
    counts[
      `${effectiveStatusToCountKey(r.status)}Count` as keyof DigestCounts
    ]++;
  }

  if (rows.length === 0) {
    logger.debug(
      { analysisDate: input.analysisDate },
      'no dnsviz rows for digest email',
    );
    return { sent: false, totalRows: 0, ...counts };
  }

  const isScoped = !!(input.domainFilter && input.domainFilter.length > 0);
  const subjectPrefix = input.subjectPrefix ?? '[DNSViz]';
  // Lead with the actionable buckets (BOGUS / ERROR / WARN), then the
  // non-actionable / informational ones, so the subject line reads
  // worst-first at a glance.
  const subject =
    `${subjectPrefix} ${input.analysisDate}: ` +
    `${counts.bogusCount} bogus, ` +
    `${counts.errorCount} error, ` +
    `${counts.warnCount} warn, ` +
    `${counts.expectedErrorCount} expected, ` +
    `${counts.insecureCount} insecure, ` +
    `${counts.secureCount} secure`;

  const html = renderDigestEmailHtml({
    rows,
    counts,
    totalRows: rows.length,
    analysisDate: input.analysisDate,
    workflowRunId: input.workflowRunId,
    isScoped,
  });
  const plain = renderDigestEmailPlain({
    rows,
    counts,
    totalRows: rows.length,
    analysisDate: input.analysisDate,
    workflowRunId: input.workflowRunId,
    isScoped,
  });

  await sendMail({
    to: [
      'reports+dnssec@d3serve.xyz',
      'asset-report-aaaao27zt2zkdocu7mqxfdxvzm@namefi.slack.com',
    ],
    subject,
    content: { html, plain },
    from: 'DNSViz <noreply@d3serve.xyz>',
  });

  logger.info(
    { analysisDate: input.analysisDate, totalRows: rows.length, ...counts },
    'sent dnsviz digest email',
  );

  return { sent: true, totalRows: rows.length, ...counts };
}

export interface DeleteExpiredDnsvizAnalysesInput {
  /** ISO timestamp; rows with `expires_at < before` are deleted. */
  before: string;
  batchSize: number;
}

export interface DeleteExpiredDnsvizAnalysesResult {
  deletedCount: number;
  remaining: number;
}

/**
 * One iteration of cleanup: delete up to `batchSize` rows older than the
 * cutoff and report how many remain. The cleanup workflow loops until
 * `remaining === 0` or it hits its iteration cap.
 */
export async function deleteExpiredDnsvizAnalyses(
  input: DeleteExpiredDnsvizAnalysesInput,
): Promise<DeleteExpiredDnsvizAnalysesResult> {
  const cutoff = new Date(input.before);
  if (Number.isNaN(cutoff.getTime())) {
    throw new Error(`invalid cutoff timestamp: ${input.before}`);
  }

  const candidates = await database
    .select({ id: dnsvizAnalysesTable.id })
    .from(dnsvizAnalysesTable)
    .where(lt(dnsvizAnalysesTable.expiresAt, cutoff))
    .limit(input.batchSize);

  if (candidates.length === 0) {
    return { deletedCount: 0, remaining: 0 };
  }

  await database.delete(dnsvizAnalysesTable).where(
    inArray(
      dnsvizAnalysesTable.id,
      candidates.map((r) => r.id),
    ),
  );

  const [remainingRow] = await database
    .select({ remaining: sql<number>`COUNT(*)::int` })
    .from(dnsvizAnalysesTable)
    .where(lt(dnsvizAnalysesTable.expiresAt, cutoff));

  return {
    deletedCount: candidates.length,
    remaining: remainingRow?.remaining ?? 0,
  };
}

// --- helpers ---

function computeExpiresAt(analysisDate: string, retentionDays: number): Date {
  const base = new Date(`${analysisDate}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) {
    throw new Error(`invalid analysisDate: ${analysisDate}`);
  }
  base.setUTCDate(base.getUTCDate() + Math.max(1, Math.floor(retentionDays)));
  return base;
}

function statusToCountKey(
  s: DnsvizAnalysisStatus,
): 'secure' | 'insecure' | 'bogus' | 'error' {
  switch (s) {
    case 'SECURE':
      return 'secure';
    case 'INSECURE':
      return 'insecure';
    case 'BOGUS':
      return 'bogus';
    case 'ERROR':
      return 'error';
  }
}

/**
 * Six-bucket counterpart to `statusToCountKey`, used by the digest
 * email which surfaces effective (post-reclassification) statuses.
 */
function effectiveStatusToCountKey(
  s: DnsvizEffectiveStatus,
): 'secure' | 'insecure' | 'bogus' | 'error' | 'expectedError' | 'warn' {
  switch (s) {
    case 'SECURE':
      return 'secure';
    case 'INSECURE':
      return 'insecure';
    case 'BOGUS':
      return 'bogus';
    case 'ERROR':
      return 'error';
    case 'EXPECTED_ERROR':
      return 'expectedError';
    case 'WARN':
      return 'warn';
  }
}

function formatErrorMessage(err: unknown): string {
  if (err instanceof DnsvizError) {
    const tail = err.stderr ? ` | stderr: ${err.stderr.slice(0, 400)}` : '';
    return `${err.message}${tail}`.slice(0, 1000);
  }
  if (err instanceof Error) {
    return err.message.slice(0, 1000);
  }
  return String(err).slice(0, 1000);
}

interface DigestRow {
  id: string;
  domainName: NamefiNormalizedDomain;
  registrarKey: string;
  /** Effective status (post-reclassification overlay). */
  status: DnsvizEffectiveStatus;
  /** Raw `dnsviz_analyses.status`, used by `formatStatusReasoning`. */
  rawStatus: DnsvizAnalysisStatus;
  summary: DnsvizAnalysisSummary | null;
  errorMessage: string | null;
}

interface DigestCounts {
  secureCount: number;
  insecureCount: number;
  bogusCount: number;
  errorCount: number;
  expectedErrorCount: number;
  warnCount: number;
}

interface DigestEmailArgs {
  rows: DigestRow[];
  counts: DigestCounts;
  totalRows: number;
  analysisDate: string;
  workflowRunId: string;
  /**
   * True when called with `domainFilter` (the on-demand path). In scoped
   * mode every row is shown in the verdict table because the caller has
   * explicitly opted into that subset. In unscoped/daily mode the SECURE
   * tail is truncated at `DIGEST_LIST_TRUNCATE` so a 1000-domain
   * environment doesn't produce a 1000-row email.
   */
  isScoped: boolean;
}

/**
 * Per-row human-readable justification of the verdict, derived from the
 * `summary` jsonb (`delegationStatus`, `parentChainStatuses`) and any
 * `errorMessage` on the row. Showing this column makes the parser's
 * decision auditable from the email alone — if a domain is flagged with
 * the wrong status, the reasoning string makes it obvious whether the
 * input grok was off (`delegation.status` mismatched expectations) or the
 * mapping logic is buggy.
 */
function formatStatusReasoning(row: DigestRow): string {
  const summary = row.summary;
  const leafKey = `${row.domainName.toLowerCase()}.`;
  const parents = Object.entries(summary?.parentChainStatuses ?? {})
    .filter(([k]) => k !== '.' && k !== leafKey)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const parentsTail = parents ? `; parents: ${parents}` : '';

  // Reasoning is always derived from the *raw* grok verdict — the
  // overlay reclassification is operational metadata, not a different
  // verdict from the analyzer.
  switch (row.rawStatus) {
    case 'SECURE':
      return `delegation.status=SECURE for ${leafKey}${parentsTail}`;
    case 'INSECURE':
      return `delegation.status=INSECURE for ${leafKey} (no DS published)${parentsTail}`;
    case 'BOGUS': {
      const firstErr =
        summary?.topErrors?.[0] ?? row.errorMessage ?? '(no error description)';
      return `delegation.status=BOGUS for ${leafKey} — ${firstErr.slice(0, 200)}`;
    }
    case 'ERROR': {
      const detail =
        row.errorMessage ?? summary?.topErrors?.[0] ?? '(no detail captured)';
      const delegStatus = summary?.delegationStatus ?? '(missing)';
      return `derived ERROR (delegation.status=${delegStatus}) — ${detail.slice(0, 200)}`;
    }
  }
}

// Worst-first sort order. Actionable buckets (BOGUS / ERROR) come
// before the heads-up bucket (WARN), then the informational ones
// (INSECURE / EXPECTED_ERROR / SECURE).
const STATUS_PRIORITY: Record<DnsvizEffectiveStatus, number> = {
  BOGUS: 0,
  ERROR: 1,
  WARN: 2,
  INSECURE: 3,
  EXPECTED_ERROR: 4,
  SECURE: 5,
};

function sortByStatusPriority(rows: DigestRow[]): DigestRow[] {
  return [...rows].sort((a, b) => {
    const dp = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (dp !== 0) return dp;
    return a.domainName.localeCompare(b.domainName);
  });
}

/**
 * In daily (unscoped) mode the SECURE and EXPECTED_ERROR buckets can
 * each have thousands of rows; surfacing all of them would make the
 * email enormous. Truncate each non-actionable bucket to the first N
 * rows and append a "+rest" placeholder. Actionable buckets
 * (BOGUS/ERROR/WARN) and INSECURE are never truncated. In scoped mode
 * (on-demand) every input row is shown by name.
 */
function truncateNoiseRows(
  rows: DigestRow[],
  isScoped: boolean,
): {
  shown: DigestRow[];
  secureOverflow: number;
  expectedErrorOverflow: number;
} {
  if (isScoped)
    return { shown: rows, secureOverflow: 0, expectedErrorOverflow: 0 };
  const visible = rows.filter(
    (r) => r.status !== 'SECURE' && r.status !== 'EXPECTED_ERROR',
  );
  const secure = rows.filter((r) => r.status === 'SECURE');
  const expectedError = rows.filter((r) => r.status === 'EXPECTED_ERROR');
  const shownSecure = secure.slice(0, DIGEST_LIST_TRUNCATE);
  const shownExpectedError = expectedError.slice(0, DIGEST_LIST_TRUNCATE);
  return {
    shown: [...visible, ...shownExpectedError, ...shownSecure],
    secureOverflow: secure.length - shownSecure.length,
    expectedErrorOverflow: expectedError.length - shownExpectedError.length,
  };
}

const STATUS_COLOR: Record<DnsvizEffectiveStatus, string> = {
  BOGUS: '#cf222e',
  ERROR: '#cf222e',
  // WARN: amber — heads-up because the domain is on custom NS, but
  // not actionable from the Namefi side.
  WARN: '#9a6700',
  INSECURE: '#9a6700',
  // EXPECTED_ERROR: muted — explained by indexed-domain state, no
  // operator action needed.
  EXPECTED_ERROR: '#6e7781',
  SECURE: '#1a7f37',
};

function renderDigestEmailHtml(args: DigestEmailArgs): string {
  const { rows, counts, totalRows, analysisDate, workflowRunId, isScoped } =
    args;

  const summaryBox = `
<div style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:16px 20px;margin:16px 0;font-size:13px">
  <strong>Summary for ${escapeHtml(analysisDate)}</strong> — ${totalRows} domain(s) analyzed
  <ul style="margin:8px 0 0 0;padding-left:20px">
    <li><span style="color:${STATUS_COLOR.BOGUS}">BOGUS</span>: <strong>${counts.bogusCount}</strong> (DNSSEC misconfigured — actionable)</li>
    <li><span style="color:${STATUS_COLOR.ERROR}">ERROR</span>: <strong>${counts.errorCount}</strong> (probe/grok failed)</li>
    <li><span style="color:${STATUS_COLOR.WARN}">WARN</span>: <strong>${counts.warnCount}</strong> (DNSSEC issue on custom NS — not actionable from Namefi)</li>
    <li><span style="color:${STATUS_COLOR.INSECURE}">INSECURE</span>: <strong>${counts.insecureCount}</strong> (no DNSSEC)</li>
    <li><span style="color:${STATUS_COLOR.EXPECTED_ERROR}">EXPECTED ERROR</span>: <strong>${counts.expectedErrorCount}</strong> (no delegation, but indexed state explains why)</li>
    <li><span style="color:${STATUS_COLOR.SECURE}">SECURE</span>: <strong>${counts.secureCount}</strong></li>
  </ul>
</div>`;

  const sorted = sortByStatusPriority(rows);
  const { shown, secureOverflow, expectedErrorOverflow } = truncateNoiseRows(
    sorted,
    isScoped,
  );

  const tableRows = shown
    .map((r) => {
      const reasoning = formatStatusReasoning(r);
      return `<tr>
  <td><code>${escapeHtml(r.domainName)}</code></td>
  <td><strong style="color:${STATUS_COLOR[r.status]}">${escapeHtml(r.status)}</strong></td>
  <td>${escapeHtml(r.registrarKey)}</td>
  <td>${escapeHtml(reasoning)}</td>
</tr>`;
    })
    .join('\n');

  const overflowRows: string[] = [];
  if (expectedErrorOverflow > 0) {
    overflowRows.push(
      `<tr><td colspan="4" style="text-align:center;color:#666;font-style:italic">… +${expectedErrorOverflow} more EXPECTED ERROR row(s) — list truncated in daily mode</td></tr>`,
    );
  }
  if (secureOverflow > 0) {
    overflowRows.push(
      `<tr><td colspan="4" style="text-align:center;color:#666;font-style:italic">… +${secureOverflow} more SECURE row(s) — list truncated in daily mode</td></tr>`,
    );
  }
  const overflowRow = overflowRows.join('\n');

  const tableSection =
    rows.length === 0
      ? '<p style="margin-top:16px;color:#666">No rows returned for this analysis date.</p>'
      : `
<h3 style="margin-top:24px">Verdicts</h3>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;width:100%">
  <thead style="background:#f6f8fa"><tr><th>Domain</th><th>Status</th><th>Registrar</th><th>Reasoning</th></tr></thead>
  <tbody>${tableRows}${overflowRow}</tbody>
</table>`;

  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#222;max-width:1000px;margin:0 auto;padding:16px">
<p style="color:#666;font-size:12px;margin-bottom:0">Workflow run: <code>${escapeHtml(workflowRunId)}</code>${isScoped ? ' (on-demand, scoped to caller-supplied domain list)' : ''}</p>
${summaryBox}
${tableSection}
<p style="font-size:12px;color:#666;margin-top:24px">Render any row's chain-of-trust graph with <code>GET /v1/dnsviz/analysis/&lt;id&gt;/graph</code>. The "Reasoning" column shows the parser's decision so you can spot a bad verdict directly.</p>
</body></html>`;
}

function renderDigestEmailPlain(args: DigestEmailArgs): string {
  const { rows, counts, totalRows, analysisDate, workflowRunId, isScoped } =
    args;

  const lines: string[] = [];
  lines.push(`DNSViz digest — ${analysisDate}`);
  lines.push(
    `Workflow run: ${workflowRunId}${isScoped ? ' (on-demand, scoped)' : ''}`,
  );
  lines.push('');
  lines.push(`Summary (${totalRows} analyzed):`);
  lines.push(`  BOGUS          ${counts.bogusCount}`);
  lines.push(`  ERROR          ${counts.errorCount}`);
  lines.push(`  WARN           ${counts.warnCount}`);
  lines.push(`  INSECURE       ${counts.insecureCount}`);
  lines.push(`  EXPECTED_ERROR ${counts.expectedErrorCount}`);
  lines.push(`  SECURE         ${counts.secureCount}`);
  lines.push('');

  if (rows.length === 0) {
    lines.push('No rows returned for this analysis date.');
    return `${lines.join('\n')}\n`;
  }

  const sorted = sortByStatusPriority(rows);
  const { shown, secureOverflow, expectedErrorOverflow } = truncateNoiseRows(
    sorted,
    isScoped,
  );

  lines.push('=== Verdicts ===');
  for (const r of shown) {
    const reasoning = formatStatusReasoning(r);
    lines.push(
      `- ${r.domainName}\t${r.status}\t${r.registrarKey}\t${reasoning}`,
    );
  }
  if (expectedErrorOverflow > 0) {
    lines.push(
      `  … +${expectedErrorOverflow} more EXPECTED_ERROR rows (truncated in daily mode)`,
    );
  }
  if (secureOverflow > 0) {
    lines.push(
      `  … +${secureOverflow} more SECURE rows (truncated in daily mode)`,
    );
  }

  return `${lines.join('\n')}\n`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
