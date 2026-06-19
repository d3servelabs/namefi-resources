/**
 * Activities for the weekly parked-domain verification report.
 *
 * Flow (orchestrated by `weeklyParkedDomainVerificationWorkflow`):
 *   collectParkedDomains → verifyParkedDomainsChunk (per chunk) →
 *   sendParkedDomainVerificationReportEmail.
 *
 * To keep Temporal payloads small, chunk activities return a compact summary
 * (counts + only the warn/fail domains), never the full per-domain results.
 */

import { format } from 'date-fns';
import {
  db,
  domainConfigTable,
  namefiNftCte,
  namefiNftView,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { and, sql } from 'drizzle-orm';
import { createElement } from 'react';
import { render } from '@react-email/components';
import {
  type ParkedDomainVerification,
  verifyParkedDomains,
} from '#lib/domains/parking-verification';
import { createLogger } from '#lib/logger';
import { sendMail, type SendMailInput } from '../../../../mail/mail-client';
import {
  ParkedDomainVerificationReport,
  type ParkedDomainProblem,
} from '../../../../mail/templates/parked-domain-verification-report';

const _logger = createLogger({ module: 'parked-domain-verification-report' });

const ADMIN_URL = 'https://astra.namefi.io/admin/parked-domains';

/**
 * Recipients for the weekly parked-domain report. Reuses the nft-management
 * daily report's destinations (per product decision — no dedicated env var):
 * an email alias + the asset-report Slack ingest address.
 */
const REPORT_RECIPIENTS = [
  'reports+nft@d3serve.xyz',
  'asset-report-aaaao27zt2zkdocu7mqxfdxvzm@namefi.slack.com',
];
const REPORT_FROM = 'Namefi Parking Verification <noreply@d3serve.xyz>';

/** Upper bound on parked domains enumerated per run (logged when exceeded). */
const MAX_DOMAINS_PER_RUN = 10_000;

/**
 * A domain is parked (served by Namefi park infra) when auto-park is on
 * (default true) OR a forward is configured. Mirrors `PARK_CONDITION` in
 * `apps/backend/src/trpc/routers/admin/parkedDomainsRouter.ts`.
 */
const PARK_CONDITION = sql`COALESCE(${domainConfigTable.autoParkEnabled}, true) = true OR ${domainConfigTable.forwardTo} IS NOT NULL`;

export interface CollectParkedDomainsResult {
  domains: NamefiNormalizedDomain[];
  /** Total distinct parked domains (may exceed `domains.length` if capped). */
  totalParked: number;
}

export interface ParkedVerificationCounts {
  pass: number;
  warn: number;
  fail: number;
  skipped: number;
}

export interface ParkedVerificationChunkReport {
  total: number;
  counts: ParkedVerificationCounts;
  /** Only warn/fail domains, to keep the activity payload small. */
  problems: ParkedDomainProblem[];
}

export interface SendParkedDomainVerificationReportInput {
  generatedAt: string;
  totalParked: number;
  totalChecked: number;
  counts: ParkedVerificationCounts;
  problems: ParkedDomainProblem[];
  problemsTruncated: boolean;
}

/** Enumerate distinct parked domains for the weekly sweep. */
export async function collectParkedDomains(): Promise<CollectParkedDomainsResult> {
  const leftJoinOn = sql`${domainConfigTable.normalizedDomainName} = ${namefiNftView.normalizedDomainName}`;

  const [rows, countRows] = await Promise.all([
    db
      .with(namefiNftCte)
      .selectDistinct({
        normalizedDomainName: namefiNftView.normalizedDomainName,
      })
      .from(namefiNftView)
      .leftJoin(domainConfigTable, leftJoinOn)
      .where(and(PARK_CONDITION))
      .limit(MAX_DOMAINS_PER_RUN),
    db
      .with(namefiNftCte)
      .select({
        count: sql<number>`COUNT(DISTINCT ${namefiNftView.normalizedDomainName})::int`,
      })
      .from(namefiNftView)
      .leftJoin(domainConfigTable, leftJoinOn)
      .where(and(PARK_CONDITION)),
  ]);

  const totalParked = countRows[0]?.count ?? rows.length;
  if (totalParked > MAX_DOMAINS_PER_RUN) {
    _logger.warn(
      { totalParked, cap: MAX_DOMAINS_PER_RUN },
      'Parked-domain count exceeds per-run cap; report will note the truncation',
    );
  }

  return {
    domains: rows.map((r) => r.normalizedDomainName),
    totalParked,
  };
}

function toProblem(
  result: ParkedDomainVerification,
): ParkedDomainProblem | null {
  if (result.overall !== 'warn' && result.overall !== 'fail') return null;
  const issues: string[] = [];
  const checks = [
    ['DNS', result.dns],
    ['SSL', result.ssl],
    ['Serving', result.serving],
    ['Redirect', result.redirect],
  ] as const;
  for (const [label, check] of checks) {
    if (check.status === 'warn' || check.status === 'fail') {
      issues.push(`${label}: ${check.detail}`);
    }
  }
  return {
    domain: result.domain,
    mode: result.mode,
    overall: result.overall,
    dns: result.dns.status,
    ssl: result.ssl.status,
    serving: result.serving.status,
    redirect: result.redirect.status,
    issues,
  };
}

/** Verify one chunk of domains and reduce to a compact report. */
export async function verifyParkedDomainsChunk(input: {
  domains: NamefiNormalizedDomain[];
  concurrency?: number;
}): Promise<ParkedVerificationChunkReport> {
  const results = await verifyParkedDomains(input.domains, {
    concurrency: input.concurrency ?? 8,
  });

  const counts: ParkedVerificationCounts = {
    pass: 0,
    warn: 0,
    fail: 0,
    skipped: 0,
  };
  const problems: ParkedDomainProblem[] = [];
  for (const result of results) {
    counts[result.overall] += 1;
    const problem = toProblem(result);
    if (problem) problems.push(problem);
  }

  return { total: results.length, counts, problems };
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildProblemsCsv(problems: ParkedDomainProblem[]): string {
  const headers = [
    'Domain',
    'Mode',
    'Overall',
    'DNS',
    'SSL',
    'Serving',
    'Redirect',
    'Issues',
  ];
  const rows = problems.map((p) =>
    [
      p.domain,
      p.mode,
      p.overall,
      p.dns,
      p.ssl,
      p.serving,
      p.redirect,
      p.issues.join(' | '),
    ]
      .map(csvEscape)
      .join(','),
  );
  return [headers.map(csvEscape).join(','), ...rows].join('\n');
}

/** Render and email the weekly parked-domain verification report. */
export async function sendParkedDomainVerificationReportEmail(
  input: SendParkedDomainVerificationReportInput,
): Promise<void> {
  const reportDate = format(new Date(input.generatedAt), 'yyyy-MM-dd');
  const title = `Weekly Parked-Domain Verification — ${reportDate}`;
  const truncatedDomains = Math.max(0, input.totalParked - input.totalChecked);

  const element = createElement(ParkedDomainVerificationReport, {
    title,
    generatedAt: input.generatedAt,
    totalParked: input.totalParked,
    totalChecked: input.totalChecked,
    truncatedDomains,
    counts: input.counts,
    problems: input.problems,
    problemsTruncated: input.problemsTruncated,
    adminUrl: ADMIN_URL,
  });

  const html = await render(element);
  const plain = await render(element, { plainText: true });

  const attachments: SendMailInput['attachments'] = input.problems.length
    ? [
        {
          filename: `parked-domain-problems-${reportDate}.csv`,
          content: buildProblemsCsv(input.problems),
          contentType: 'text/csv',
        },
      ]
    : [];

  await sendMail({
    to: REPORT_RECIPIENTS,
    subject: title,
    content: { html, plain },
    from: REPORT_FROM,
    attachments,
  });

  _logger.info(
    {
      totalChecked: input.totalChecked,
      counts: input.counts,
      problems: input.problems.length,
    },
    'Sent weekly parked-domain verification report',
  );
}
