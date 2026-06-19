import type { CSSProperties } from 'react';
import { Hr, Link, Section, Text } from '@react-email/components';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';

export type ReportCheckStatus = 'pass' | 'warn' | 'fail' | 'skipped';

/** One parked domain that failed or warned during the weekly sweep. */
export interface ParkedDomainProblem {
  domain: string;
  mode: 'park' | 'forward';
  overall: 'warn' | 'fail';
  dns: ReportCheckStatus;
  ssl: ReportCheckStatus;
  serving: ReportCheckStatus;
  redirect: ReportCheckStatus;
  issues: string[];
}

export interface ParkedDomainVerificationReportProps {
  title: string;
  /** ISO timestamp the sweep finished. */
  generatedAt: string;
  /** Parked domains discovered. */
  totalParked: number;
  /** Domains actually verified (after any discovery cap). */
  totalChecked: number;
  /** Parked domains not verified because the discovery cap was hit. */
  truncatedDomains: number;
  counts: { pass: number; warn: number; fail: number; skipped: number };
  /** Warn/fail domains, possibly capped for email size. */
  problems: ParkedDomainProblem[];
  /** Whether the problems list was capped. */
  problemsTruncated: boolean;
  adminUrl: string;
}

const heading: CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  margin: '0 0 8px',
};
const lead: CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  margin: '0 0 16px',
};
const summaryText: CSSProperties = { fontSize: '14px', margin: '4px 0' };
const cell: CSSProperties = {
  padding: '6px 8px',
  fontSize: '12px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'left',
  verticalAlign: 'top',
};
const headerCell: CSSProperties = {
  ...cell,
  fontWeight: 700,
  borderBottom: '2px solid #cbd5e1',
  whiteSpace: 'nowrap',
};
const caption: CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '16px 0 0',
};

const STATUS_COLOR: Record<ReportCheckStatus, string> = {
  pass: '#15803d',
  warn: '#b45309',
  fail: '#b91c1c',
  skipped: '#64748b',
};

function StatusText({ status }: { status: ReportCheckStatus }) {
  return (
    <span style={{ color: STATUS_COLOR[status], fontWeight: 600 }}>
      {status.toUpperCase()}
    </span>
  );
}

/**
 * Internal ops/admin report — intentionally exempt from the user-facing
 * email-template contract (no recipientName/recipientEmail, personalized
 * greeting, or <GoToDashboard/>). It is sent to a fixed ops distribution list,
 * not to end users, so those personalization fields do not apply.
 */
export const ParkedDomainVerificationReport =
  buildTemplate<ParkedDomainVerificationReportProps>(
    ({
      title,
      generatedAt,
      totalParked,
      totalChecked,
      truncatedDomains,
      counts,
      problems,
      problemsTruncated,
      adminUrl,
    }) => {
      const totalFailures = counts.warn + counts.fail;
      const csvNote =
        problems.length === 0
          ? ''
          : problemsTruncated
            ? ` The attached CSV lists the first ${problems.length} of ${totalFailures} failing domains.`
            : ` The attached CSV lists all ${problems.length} failing domains.`;
      return (
        <NamefiEmailContainer title={title} footer={false}>
          <Text style={heading}>{title}</Text>
          <Text style={lead}>
            Weekly health check of parked domains — DNS propagation, SSL,
            parking page, and redirect behavior.
          </Text>

          <Section>
            <Text style={summaryText}>
              <strong>Parked domains:</strong> {totalParked}
              {truncatedDomains > 0
                ? ` (verified ${totalChecked}; ${truncatedDomains} not checked — discovery cap)`
                : ''}
            </Text>
            <Text style={summaryText}>
              <strong>Healthy:</strong>{' '}
              <span style={{ color: STATUS_COLOR.pass }}>
                {counts.pass} pass
              </span>{' '}
              ·{' '}
              <span style={{ color: STATUS_COLOR.warn }}>
                {counts.warn} warn
              </span>{' '}
              ·{' '}
              <span style={{ color: STATUS_COLOR.fail }}>
                {counts.fail} fail
              </span>{' '}
              ·{' '}
              <span style={{ color: STATUS_COLOR.skipped }}>
                {counts.skipped} n/a
              </span>
            </Text>
            <Text style={summaryText}>
              <Link href={adminUrl}>Open the parked-domains admin page →</Link>
            </Text>
          </Section>

          <Hr />

          {problems.length === 0 ? (
            <Text style={{ ...summaryText, color: STATUS_COLOR.pass }}>
              ✅ All verified parked domains are healthy.
            </Text>
          ) : (
            <>
              <Text style={{ ...summaryText, fontWeight: 700 }}>
                {counts.fail + counts.warn} domain(s) need attention
                {problemsTruncated ? ` (showing first ${problems.length})` : ''}
                :
              </Text>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '8px',
                }}
              >
                <thead>
                  <tr>
                    <th style={headerCell}>Domain</th>
                    <th style={headerCell}>Mode</th>
                    <th style={headerCell}>DNS</th>
                    <th style={headerCell}>SSL</th>
                    <th style={headerCell}>Serving</th>
                    <th style={headerCell}>Redirect</th>
                    <th style={headerCell}>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((p) => (
                    <tr key={p.domain}>
                      <td style={{ ...cell, fontWeight: 600 }}>{p.domain}</td>
                      <td style={cell}>{p.mode}</td>
                      <td style={cell}>
                        <StatusText status={p.dns} />
                      </td>
                      <td style={cell}>
                        <StatusText status={p.ssl} />
                      </td>
                      <td style={cell}>
                        <StatusText status={p.serving} />
                      </td>
                      <td style={cell}>
                        <StatusText status={p.redirect} />
                      </td>
                      <td style={cell}>{p.issues.join(' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <Text style={caption}>
            Generated automatically at {generatedAt}.{csvNote} Reply to this
            email or open the admin page to re-verify a domain.
          </Text>
        </NamefiEmailContainer>
      );
    },
    {
      title: 'Weekly Parked-Domain Verification — 2026-06-22',
      generatedAt: '2026-06-22T08:00:00.000Z',
      totalParked: 1229,
      totalChecked: 1229,
      truncatedDomains: 0,
      counts: { pass: 1204, warn: 11, fail: 7, skipped: 7 },
      problems: [
        {
          domain: 'example.com',
          mode: 'park',
          overall: 'fail',
          dns: 'pass',
          ssl: 'fail',
          serving: 'fail',
          redirect: 'pass',
          issues: ['Certificate expired (Jun 1 2026).'],
        },
      ],
      problemsTruncated: false,
      adminUrl: 'https://app.namefi.io/admin/parked-domains',
    },
  );

export default ParkedDomainVerificationReport;
