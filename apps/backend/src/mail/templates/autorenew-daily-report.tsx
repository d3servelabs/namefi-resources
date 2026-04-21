// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
import {
  anchor,
  astraTheme,
  bodySmall,
  caption,
  heading,
  hr,
  mutedPanel,
  panelText,
  panelTitle,
  sectionHeading,
  sectionLead,
} from '../styles';
import type {
  AutoRenewDailyReportProps,
  AutoRenewDomainEntry,
  AutoRenewReportSummary,
  AutoRenewSnapshotCategory,
} from './autorenew-daily-report.types';

/** Max rows rendered per failure category before the "see CSV" note. */
const DOMAINS_VISIBLE_LIMIT_PER_CATEGORY = 10;
/** Tighter cap for the renewed category — de-emphasized in the summary email. */
const RENEWED_VISIBLE_LIMIT = 5;

type Severity = 'warning' | 'danger' | 'info';

const severityAccent: Record<Severity, string> = {
  warning: astraTheme.warningInk,
  danger: astraTheme.errorInk,
  info: astraTheme.infoInk,
};

function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `$${amount.toFixed(2)}`;
}

function formatUserRef(entry: AutoRenewDomainEntry): string {
  return entry.userEmail || entry.userId;
}

function formatRegistrar(registrar: string | undefined): string {
  if (!registrar) return '—';
  if (registrar === 'dynadot_gdg') return 'Dynadot (GDG)';
  if (registrar === 'dynadot_regular') return 'Dynadot (Regular)';
  if (registrar === 'route53') return 'Route 53';
  return registrar;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function CategoryHeader({
  title,
  description,
  total,
  severity,
  extraNote,
}: {
  title: string;
  description: string;
  total: number;
  severity: Severity;
  extraNote?: string;
}) {
  return (
    <Section style={{ marginTop: '28px' }}>
      <Text
        style={{
          ...sectionHeading,
          color: severityAccent[severity],
          margin: '0 0 4px',
        }}
      >
        {title} — {total.toLocaleString()}
        {extraNote ? ` · ${extraNote}` : ''}
      </Text>
      <Text style={{ ...sectionLead, margin: '0 0 12px' }}>{description}</Text>
    </Section>
  );
}

function EmptyCategory({ message }: { message: string }) {
  return (
    <Text
      style={{ ...bodySmall, color: astraTheme.successInk, margin: '0 0 8px' }}
    >
      {message}
    </Text>
  );
}

function TruncationNote({
  visible,
  total,
}: {
  visible: number;
  total: number;
}) {
  if (total <= visible) return null;
  return (
    <Text style={{ ...caption, marginTop: '8px' }}>
      Showing first {visible.toLocaleString()} of {total.toLocaleString()} —
      full data in the attached CSV and HTML report.
    </Text>
  );
}

/**
 * Table rendering for failure categories (payment / registrar / missing-price).
 * Shows domain, user, registrar/reason/price per the column layout for that category.
 */
function FailureCategoryTable({
  entries,
  columns,
}: {
  entries: AutoRenewDomainEntry[];
  columns: Array<'registrar' | 'price' | 'reason'>;
}) {
  return (
    <EmailTable>
      <thead>
        <EmailTableRow>
          <EmailTableHeaderCell>Domain</EmailTableHeaderCell>
          <EmailTableHeaderCell>User</EmailTableHeaderCell>
          {columns.includes('registrar') && (
            <EmailTableHeaderCell>Registrar</EmailTableHeaderCell>
          )}
          {columns.includes('price') && (
            <EmailTableHeaderCell numeric>Price</EmailTableHeaderCell>
          )}
          {columns.includes('reason') && (
            <EmailTableHeaderCell>Reason</EmailTableHeaderCell>
          )}
        </EmailTableRow>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <EmailTableRow key={`${entry.normalizedDomainName}-${entry.userId}`}>
            <EmailTableCell label="Domain" emphasis>
              {entry.normalizedDomainName}
            </EmailTableCell>
            <EmailTableCell label="User">{formatUserRef(entry)}</EmailTableCell>
            {columns.includes('registrar') && (
              <EmailTableCell label="Registrar">
                {formatRegistrar(entry.registrarKey)}
              </EmailTableCell>
            )}
            {columns.includes('price') && (
              <EmailTableCell label="Price" numeric>
                {formatUsd(entry.chargeAmountInUsd)}
              </EmailTableCell>
            )}
            {columns.includes('reason') && (
              <EmailTableCell label="Reason">
                {entry.reason ?? '—'}
              </EmailTableCell>
            )}
          </EmailTableRow>
        ))}
      </tbody>
    </EmailTable>
  );
}

function PaymentFailedSection({
  entries,
  total,
}: {
  entries: AutoRenewDomainEntry[];
  total: number;
}) {
  return (
    <>
      <CategoryHeader
        title="Payment Failed"
        description="We couldn't charge the user's payment methods — no renewals attempted for the affected domains."
        total={total}
        severity="danger"
      />
      {total === 0 ? (
        <EmptyCategory message="No payment failures." />
      ) : (
        <>
          <FailureCategoryTable
            entries={entries.slice(0, DOMAINS_VISIBLE_LIMIT_PER_CATEGORY)}
            columns={['price', 'reason']}
          />
          <TruncationNote
            visible={DOMAINS_VISIBLE_LIMIT_PER_CATEGORY}
            total={total}
          />
        </>
      )}
    </>
  );
}

function RegistrarFailedSection({
  entries,
  total,
}: {
  entries: AutoRenewDomainEntry[];
  total: number;
}) {
  return (
    <>
      <CategoryHeader
        title="Registrar Failure"
        description="Payment succeeded but the registrar rejected the renewal. Usually needs ops intervention."
        total={total}
        severity="danger"
      />
      {total === 0 ? (
        <EmptyCategory message="No registrar failures." />
      ) : (
        <>
          <FailureCategoryTable
            entries={entries.slice(0, DOMAINS_VISIBLE_LIMIT_PER_CATEGORY)}
            columns={['registrar', 'price', 'reason']}
          />
          <TruncationNote
            visible={DOMAINS_VISIBLE_LIMIT_PER_CATEGORY}
            total={total}
          />
        </>
      )}
    </>
  );
}

function DeferredInsufficientBalanceSection({
  entries,
  summary,
}: {
  entries: AutoRenewDomainEntry[];
  summary: AutoRenewReportSummary['deferredInsufficientBalance'];
}) {
  const extraNote =
    summary.totalShortfallInUsd > 0
      ? `short by $${summary.totalShortfallInUsd.toFixed(2)} across ${summary.usersAffected} user${summary.usersAffected === 1 ? '' : 's'}`
      : undefined;
  return (
    <>
      <CategoryHeader
        title="Deferred — Insufficient Balance"
        description="NFSC balance didn't cover the full bill. These domains are deferred to the next cycle; a subset may still have renewed."
        total={summary.total}
        severity="warning"
        extraNote={extraNote}
      />
      {summary.total === 0 ? (
        <EmptyCategory message="No deferred domains." />
      ) : (
        <>
          <FailureCategoryTable
            entries={entries.slice(0, DOMAINS_VISIBLE_LIMIT_PER_CATEGORY)}
            columns={['registrar', 'price']}
          />
          <TruncationNote
            visible={DOMAINS_VISIBLE_LIMIT_PER_CATEGORY}
            total={summary.total}
          />
        </>
      )}
    </>
  );
}

function MissingPriceSection({
  entries,
  total,
}: {
  entries: AutoRenewDomainEntry[];
  total: number;
}) {
  return (
    <>
      <CategoryHeader
        title="Missing Price Data"
        description="We couldn't determine a renewal price. Usually a pricing-pipeline issue."
        total={total}
        severity="warning"
      />
      {total === 0 ? (
        <EmptyCategory message="No domains with missing price data." />
      ) : (
        <>
          <FailureCategoryTable
            entries={entries.slice(0, DOMAINS_VISIBLE_LIMIT_PER_CATEGORY)}
            columns={['registrar']}
          />
          <TruncationNote
            visible={DOMAINS_VISIBLE_LIMIT_PER_CATEGORY}
            total={total}
          />
        </>
      )}
    </>
  );
}

function RenewedSection({
  entries,
  summary,
}: {
  entries: AutoRenewDomainEntry[];
  summary: AutoRenewReportSummary['renewed'];
}) {
  const extraNote =
    summary.totalUsd != null && summary.totalUsd > 0
      ? `$${summary.totalUsd.toFixed(2)} charged`
      : undefined;
  return (
    <>
      <CategoryHeader
        title="Renewed"
        description="Domains successfully renewed this cycle."
        total={summary.total}
        severity="info"
        extraNote={extraNote}
      />
      {summary.total === 0 ? (
        <EmptyCategory message="No renewals this run." />
      ) : (
        <>
          <FailureCategoryTable
            entries={entries.slice(0, RENEWED_VISIBLE_LIMIT)}
            columns={['registrar', 'price']}
          />
          <TruncationNote
            visible={RENEWED_VISIBLE_LIMIT}
            total={summary.total}
          />
        </>
      )}
    </>
  );
}

function SummaryPanel({ summary }: { summary: AutoRenewReportSummary }) {
  const netRevenue = summary.totalChargedInUsd - summary.totalRefundedInUsd;
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Report date', value: summary.reportDate },
    {
      label: 'Users processed',
      value: summary.totalUsersProcessed.toLocaleString(),
    },
    {
      label: 'Domains attempted',
      value: summary.totalDomainsProcessed.toLocaleString(),
    },
    {
      label: 'Renewed',
      value: `${summary.renewed.total.toLocaleString()}${
        summary.renewed.totalUsd != null && summary.renewed.totalUsd > 0
          ? ` ($${summary.renewed.totalUsd.toFixed(2)})`
          : ''
      }`,
    },
    {
      label: 'Deferred (low balance)',
      value:
        summary.deferredInsufficientBalance.total > 0
          ? `${summary.deferredInsufficientBalance.total.toLocaleString()} (short $${summary.deferredInsufficientBalance.totalShortfallInUsd.toFixed(2)}, ${summary.deferredInsufficientBalance.usersAffected} user${summary.deferredInsufficientBalance.usersAffected === 1 ? '' : 's'})`
          : '0',
    },
    {
      label: 'Registrar failures',
      value: summary.registrarFailed.total.toLocaleString(),
    },
    {
      label: 'Payment failures',
      value: summary.paymentFailed.total.toLocaleString(),
    },
    {
      label: 'Missing price data',
      value: summary.missingPrice.total.toLocaleString(),
    },
    {
      label: 'Total charged',
      value: `$${summary.totalChargedInUsd.toFixed(2)}`,
    },
    {
      label: 'Total refunded',
      value: `$${summary.totalRefundedInUsd.toFixed(2)}`,
    },
    { label: 'Net revenue', value: `$${netRevenue.toFixed(2)}` },
    {
      label: 'NFSC balance (at run start)',
      value: `$${summary.totalNfscBalanceInUsdAtRunStart.toFixed(2)}`,
    },
    {
      label: 'Execution time',
      value: formatDuration(summary.executionTimeMs),
    },
  ];

  return (
    <Section style={mutedPanel}>
      <Text style={panelTitle}>Snapshot</Text>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '4px 0',
          }}
        >
          <span style={{ ...panelText, color: astraTheme.textMuted }}>
            {row.label}
          </span>
          <span
            style={{
              ...panelText,
              color: astraTheme.textPrimary,
              fontWeight: 600,
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </Section>
  );
}

/**
 * Summary-focused daily auto-renewal report email body.
 *
 * Layout mirrors `nft-management-report.tsx`: heading + meta links,
 * SummaryPanel, one capped category section per `AutoRenewSnapshotCategory`
 * ordered by severity, footer pointing at attachments + admin panel.
 *
 * Full per-user detail (balance, payment methods, every domain) lives
 * in the HTML attachment rendered from `AutoRenewDailyReportDetailed`.
 */
export const AutoRenewDailyReport = buildTemplate<AutoRenewDailyReportProps>(
  ({ title, summary, categorized, meta }) => {
    return (
      <NamefiEmailContainer title={title} footer={false}>
        <Text style={heading}>{title}</Text>
        <Text style={{ ...bodySmall, marginTop: '4px' }}>
          Generated {meta.generatedAt} ·{' '}
          <a href={meta.adminUrl} style={anchor}>
            Admin panel
          </a>
        </Text>

        <SummaryPanel summary={summary} />

        <PaymentFailedSection
          entries={categorized.paymentFailed}
          total={summary.paymentFailed.total}
        />
        <RegistrarFailedSection
          entries={categorized.registrarFailed}
          total={summary.registrarFailed.total}
        />
        <DeferredInsufficientBalanceSection
          entries={categorized.deferredInsufficientBalance}
          summary={summary.deferredInsufficientBalance}
        />
        <MissingPriceSection
          entries={categorized.missingPrice}
          total={summary.missingPrice.total}
        />
        <RenewedSection
          entries={categorized.renewed}
          summary={summary.renewed}
        />

        <Hr style={hr} />
        <Text style={caption}>
          {meta.attachmentNote ??
            'Auto-generated. Full per-user breakdown (balance, payment methods, every domain) is in the attached HTML and CSV files. For interactive filtering, see the admin panel.'}
        </Text>
      </NamefiEmailContainer>
    );
  },
  buildAutoRenewDailyReportFixture(),
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default AutoRenewDailyReport;

/**
 * Preview fixture for `react-email dev` / `email-templates-cli.ts`. Builds a
 * realistic 3-user run: full success, partial deferral, hard payment failure
 * + missing price. Kept at the bottom of the file so the export lives next
 * to the template.
 */
function buildAutoRenewDailyReportFixture(): AutoRenewDailyReportProps {
  const alice = { userId: 'user-alice', userEmail: 'alice@example.com' };
  const bob = { userId: 'user-bob', userEmail: 'bob@example.com' };
  const carol = { userId: 'user-carol', userEmail: 'carol@example.com' };

  const renewed: AutoRenewDomainEntry[] = [
    {
      ...alice,
      normalizedDomainName: 'alice-one.com',
      registrarKey: 'dynadot_gdg',
      chargeAmountInUsd: 11.5,
    },
    {
      ...alice,
      normalizedDomainName: 'alice-two.io',
      registrarKey: 'route53',
      chargeAmountInUsd: 9.99,
    },
    {
      ...bob,
      normalizedDomainName: 'bob-five.com',
      registrarKey: 'dynadot_regular',
      chargeAmountInUsd: 5.0,
    },
    {
      ...bob,
      normalizedDomainName: 'bob-six.net',
      registrarKey: 'dynadot_regular',
      chargeAmountInUsd: 6.0,
    },
  ];

  const deferred: AutoRenewDomainEntry[] = [
    {
      ...bob,
      normalizedDomainName: 'bob-twelve.xyz',
      registrarKey: 'dynadot_regular',
      chargeAmountInUsd: 12.0,
    },
  ];

  const paymentFailed: AutoRenewDomainEntry[] = [
    {
      ...carol,
      normalizedDomainName: 'carol-unpaid.com',
      chargeAmountInUsd: 10.0,
      reason: 'No payment method on file',
    },
  ];

  const missingPrice: AutoRenewDomainEntry[] = [
    {
      ...carol,
      normalizedDomainName: 'carol-unknown.io',
      registrarKey: 'route53',
      chargeAmountInUsd: null,
    },
  ];

  const registrarFailed: AutoRenewDomainEntry[] = [];

  return {
    title: '2026-04-21 Auto-Renewal Daily Report',
    summary: {
      reportDate: '2026-04-21',
      totalUsersProcessed: 3,
      totalDomainsProcessed: 7,
      renewed: { total: renewed.length, totalUsd: 32.49 },
      registrarFailed: { total: 0 },
      paymentFailed: { total: paymentFailed.length, totalUsd: 10 },
      deferredInsufficientBalance: {
        total: deferred.length,
        totalUsd: 12,
        totalShortfallInUsd: 1,
        usersAffected: 1,
      },
      missingPrice: { total: missingPrice.length },
      totalChargedInUsd: 32.49,
      totalRefundedInUsd: 0,
      totalNfscBalanceInUsdAtRunStart: 54,
      executionTimeMs: 92_400,
    },
    categorized: {
      renewed,
      registrarFailed,
      paymentFailed,
      deferredInsufficientBalance: deferred,
      missingPrice,
    } satisfies Record<AutoRenewSnapshotCategory, AutoRenewDomainEntry[]>,
    meta: {
      reportDate: '2026-04-21',
      generatedAt: '2026-04-21T09:00:00.000Z',
      adminUrl: 'https://astra.namefi.io/admin/auto-renewal',
    },
  };
}
