/**
 * Pure helpers for the parked-domain verification report (problem reduction +
 * CSV). Kept dependency-free (type-only imports) so they can be unit-tested
 * without pulling the activity's db / verification-engine runtime deps.
 */

import type { ParkedDomainVerification } from '#lib/domains/parking-verification';
import type { ParkedDomainProblem } from '../../../../mail/templates/parked-domain-verification-report';

/** Reduce a verification result to a report problem, or null when it's healthy. */
export function toProblem(
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

export function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function buildProblemsCsv(problems: ParkedDomainProblem[]): string {
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
