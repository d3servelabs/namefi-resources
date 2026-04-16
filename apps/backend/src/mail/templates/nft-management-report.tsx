import type { CSSProperties } from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { format } from 'date-fns';
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
  lineHeights,
  mutedPanel,
  panelText,
  panelTitle,
  sectionHeading,
  sectionLead,
  typeScale,
} from '../styles';
import type {
  CategorizedDomainEntry,
  CategorySummary,
  NftManagementReportProps,
  NftReportSummary,
} from './nft-management-report.types';

const EXPIRED_VISIBLE_LIMIT = 10;

type Severity = 'warning' | 'danger' | 'info';

const severityAccent: Record<Severity, string> = {
  warning: astraTheme.warningInk,
  danger: astraTheme.errorInk,
  info: astraTheme.infoInk,
};

function formatIsoDate(value: string | null): string {
  if (!value) return 'Unknown';
  try {
    return format(new Date(value), 'yyyy-MM-dd');
  } catch {
    return value;
  }
}

function formatDiff(seconds: number | undefined): string {
  if (seconds === undefined) return '—';
  const abs = Math.abs(seconds);
  const days = Math.floor(abs / 86_400);
  const hours = Math.floor((abs % 86_400) / 3_600);
  const sign = seconds >= 0 ? '+' : '-';
  if (days >= 1) return `${sign}${days}d ${hours}h`;
  if (hours >= 1) return `${sign}${hours}h`;
  return `${sign}${abs}s`;
}

function getChainLabel(chainId?: number): string {
  if (chainId === undefined) return '—';
  if (chainId === 1) return 'Ethereum';
  if (chainId === 8453) return 'Base';
  return `Chain ${chainId}`;
}

function shortAddress(address?: string): string {
  if (!address) return '—';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function CategoryHeader({
  title,
  description,
  summary,
  severity,
}: {
  title: string;
  description: string;
  summary: CategorySummary;
  severity: Severity;
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
        {title} — {summary.total.toLocaleString()}
        {summary.acknowledged > 0
          ? ` (${summary.needsReview.toLocaleString()} need review · ${summary.acknowledged.toLocaleString()} acknowledged)`
          : ''}
      </Text>
      <Text style={{ ...sectionLead, margin: '0 0 12px' }}>{description}</Text>
    </Section>
  );
}

function KnownIssueNote({ entry }: { entry: CategorizedDomainEntry }) {
  if (!entry.knownIssue) return null;
  return (
    <>
      <div
        style={{
          marginTop: '4px',
          fontSize: typeScale.xs,
          color: astraTheme.successInk,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Known issue · acknowledged
      </div>
      <div
        style={{
          marginTop: '2px',
          fontSize: typeScale.xs,
          color: astraTheme.textMuted,
          lineHeight: lineHeights.xs,
        }}
      >
        {entry.knownIssue.explanation}
      </div>
      <div
        style={{
          marginTop: '2px',
          fontSize: typeScale.xs,
          color: astraTheme.textSubtle,
        }}
      >
        by {entry.knownIssue.acknowledgedBy} on{' '}
        {formatIsoDate(entry.knownIssue.acknowledgedAt)}
      </div>
    </>
  );
}

function EmptyCategory({ message }: { message: string }) {
  return (
    <Text
      style={{
        ...bodySmall,
        color: astraTheme.successInk,
        margin: '0 0 8px',
      }}
    >
      {message}
    </Text>
  );
}

function acknowledgedRowStyle(
  entry: CategorizedDomainEntry,
): CSSProperties | undefined {
  if (!entry.knownIssue) return undefined;
  return { backgroundColor: astraTheme.successBackground, opacity: 0.85 };
}

function DateMismatchSection({
  entries,
  summary,
}: {
  entries: CategorizedDomainEntry[];
  summary: CategorySummary;
}) {
  return (
    <>
      <CategoryHeader
        title="Date Mismatch"
        description="Domain exists with NFT but the expiration dates differ between the registrar and the on-chain NFT."
        summary={summary}
        severity="warning"
      />
      {entries.length === 0 ? (
        <EmptyCategory message="No date mismatches detected." />
      ) : (
        <EmailTable>
          <thead>
            <EmailTableRow>
              <EmailTableHeaderCell>Domain</EmailTableHeaderCell>
              <EmailTableHeaderCell>Registrar</EmailTableHeaderCell>
              <EmailTableHeaderCell>Registrar Expires</EmailTableHeaderCell>
              <EmailTableHeaderCell>NFT Expires</EmailTableHeaderCell>
              <EmailTableHeaderCell>Diff</EmailTableHeaderCell>
            </EmailTableRow>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <EmailTableRow
                key={`mismatch-${entry.normalizedDomainName}-${entry.chainId ?? ''}`}
              >
                <EmailTableCell
                  label="Domain"
                  emphasis
                  style={acknowledgedRowStyle(entry)}
                >
                  {entry.normalizedDomainName}
                  <KnownIssueNote entry={entry} />
                </EmailTableCell>
                <EmailTableCell
                  label="Registrar"
                  style={acknowledgedRowStyle(entry)}
                >
                  {entry.registrarKey ?? '—'}
                </EmailTableCell>
                <EmailTableCell
                  label="Registrar Expires"
                  style={acknowledgedRowStyle(entry)}
                >
                  {formatIsoDate(entry.domainExpirationTime)}
                </EmailTableCell>
                <EmailTableCell
                  label="NFT Expires"
                  style={acknowledgedRowStyle(entry)}
                >
                  {formatIsoDate(entry.nftExpirationTime)}
                </EmailTableCell>
                <EmailTableCell
                  label="Diff"
                  numeric
                  style={acknowledgedRowStyle(entry)}
                >
                  {formatDiff(entry.expirationDiffSeconds)}
                </EmailTableCell>
              </EmailTableRow>
            ))}
          </tbody>
        </EmailTable>
      )}
    </>
  );
}

function DomainExistsMissingNftSection({
  entries,
  summary,
}: {
  entries: CategorizedDomainEntry[];
  summary: CategorySummary;
}) {
  return (
    <>
      <CategoryHeader
        title="Domain Exists, Missing NFT"
        description="Domain is registered at the registrar but no corresponding NFT has been minted."
        summary={summary}
        severity="warning"
      />
      {entries.length === 0 ? (
        <EmptyCategory message="No unminted active domains." />
      ) : (
        <EmailTable>
          <thead>
            <EmailTableRow>
              <EmailTableHeaderCell>Domain</EmailTableHeaderCell>
              <EmailTableHeaderCell>Registrar</EmailTableHeaderCell>
              <EmailTableHeaderCell>Registrar Expires</EmailTableHeaderCell>
            </EmailTableRow>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <EmailTableRow key={`unminted-${entry.normalizedDomainName}`}>
                <EmailTableCell
                  label="Domain"
                  emphasis
                  style={acknowledgedRowStyle(entry)}
                >
                  {entry.normalizedDomainName}
                  <KnownIssueNote entry={entry} />
                </EmailTableCell>
                <EmailTableCell
                  label="Registrar"
                  style={acknowledgedRowStyle(entry)}
                >
                  {entry.registrarKey ?? '—'}
                </EmailTableCell>
                <EmailTableCell
                  label="Registrar Expires"
                  style={acknowledgedRowStyle(entry)}
                >
                  {formatIsoDate(entry.domainExpirationTime)}
                </EmailTableCell>
              </EmailTableRow>
            ))}
          </tbody>
        </EmailTable>
      )}
    </>
  );
}

function NftExistsMissingDomainSection({
  entries,
  summary,
}: {
  entries: CategorizedDomainEntry[];
  summary: CategorySummary;
}) {
  return (
    <>
      <CategoryHeader
        title="NFT Exists, Missing Domain"
        description="NFT exists on-chain but the domain is not present in the registrar index (and the NFT is not expired)."
        summary={summary}
        severity="danger"
      />
      {entries.length === 0 ? (
        <EmptyCategory message="No orphaned NFTs detected." />
      ) : (
        <EmailTable>
          <thead>
            <EmailTableRow>
              <EmailTableHeaderCell>Domain</EmailTableHeaderCell>
              <EmailTableHeaderCell>Chain</EmailTableHeaderCell>
              <EmailTableHeaderCell>Owner</EmailTableHeaderCell>
              <EmailTableHeaderCell>NFT Expires</EmailTableHeaderCell>
            </EmailTableRow>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <EmailTableRow
                key={`orphan-${entry.normalizedDomainName}-${entry.chainId ?? ''}`}
              >
                <EmailTableCell
                  label="Domain"
                  emphasis
                  style={acknowledgedRowStyle(entry)}
                >
                  {entry.normalizedDomainName}
                  <KnownIssueNote entry={entry} />
                </EmailTableCell>
                <EmailTableCell
                  label="Chain"
                  style={acknowledgedRowStyle(entry)}
                >
                  {getChainLabel(entry.chainId)}
                </EmailTableCell>
                <EmailTableCell
                  label="Owner"
                  style={acknowledgedRowStyle(entry)}
                >
                  {shortAddress(entry.ownerAddress)}
                </EmailTableCell>
                <EmailTableCell
                  label="NFT Expires"
                  style={acknowledgedRowStyle(entry)}
                >
                  {formatIsoDate(entry.nftExpirationTime)}
                </EmailTableCell>
              </EmailTableRow>
            ))}
          </tbody>
        </EmailTable>
      )}
    </>
  );
}

function ExpiredSection({
  entries,
  summary,
}: {
  entries: CategorizedDomainEntry[];
  summary: CategorySummary;
}) {
  const visible = entries.slice(0, EXPIRED_VISIBLE_LIMIT);
  const hidden = entries.length - visible.length;
  return (
    <>
      <CategoryHeader
        title="Expired Domains (deprioritized)"
        description="Domains past their expiration date. Listed last and capped — full data is in the attached CSV."
        summary={summary}
        severity="info"
      />
      {entries.length === 0 ? (
        <EmptyCategory message="No expired domains in this run." />
      ) : (
        <>
          <EmailTable>
            <thead>
              <EmailTableRow>
                <EmailTableHeaderCell>Domain</EmailTableHeaderCell>
                <EmailTableHeaderCell>Registrar</EmailTableHeaderCell>
                <EmailTableHeaderCell>Expired On</EmailTableHeaderCell>
              </EmailTableRow>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <EmailTableRow
                  key={`expired-${entry.normalizedDomainName}-${entry.chainId ?? ''}`}
                >
                  <EmailTableCell
                    label="Domain"
                    emphasis
                    style={acknowledgedRowStyle(entry)}
                  >
                    {entry.normalizedDomainName}
                    <KnownIssueNote entry={entry} />
                  </EmailTableCell>
                  <EmailTableCell
                    label="Registrar"
                    style={acknowledgedRowStyle(entry)}
                  >
                    {entry.registrarKey ?? '—'}
                  </EmailTableCell>
                  <EmailTableCell
                    label="Expired On"
                    style={acknowledgedRowStyle(entry)}
                  >
                    {formatIsoDate(entry.domainExpirationTime)}
                  </EmailTableCell>
                </EmailTableRow>
              ))}
            </tbody>
          </EmailTable>
          {hidden > 0 ? (
            <Text style={{ ...caption, marginTop: '8px' }}>
              Showing first {EXPIRED_VISIBLE_LIMIT.toLocaleString()} of{' '}
              {entries.length.toLocaleString()} expired domains. The full list
              is available in the attached CSV.
            </Text>
          ) : null}
        </>
      )}
    </>
  );
}

function SummaryPanel({ summary }: { summary: NftReportSummary }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Total NFTs tracked', value: summary.totalNfts.toLocaleString() },
    {
      label: 'Date mismatches',
      value: `${summary.dateMismatch.total.toLocaleString()} (${summary.dateMismatch.needsReview.toLocaleString()} need review)`,
    },
    {
      label: 'Domain exists, missing NFT',
      value: `${summary.domainExistsMissingNft.total.toLocaleString()} (${summary.domainExistsMissingNft.needsReview.toLocaleString()} need review)`,
    },
    {
      label: 'NFT exists, missing domain',
      value: `${summary.nftExistsMissingDomainNotExpired.total.toLocaleString()} (${summary.nftExistsMissingDomainNotExpired.needsReview.toLocaleString()} need review)`,
    },
    {
      label: 'Expired domains',
      value: summary.expired.total.toLocaleString(),
    },
    {
      label: 'Acknowledged (known issues)',
      value: summary.knownIssuesTotal.toLocaleString(),
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

export const NftManagementReport = buildTemplate<NftManagementReportProps>(
  ({ title, summary, categorized, meta }) => {
    return (
      <NamefiEmailContainer title={title} footer={false}>
        <Text style={heading}>{title}</Text>
        <Text style={{ ...bodySmall, marginTop: '4px' }}>
          Generated {formatIsoDate(meta.generatedAt)} ·{' '}
          <a href={meta.adminUrl} style={anchor}>
            Admin panel
          </a>{' '}
          ·{' '}
          <a href={meta.githubActionsUrl} style={anchor}>
            GitHub Actions
          </a>
        </Text>

        <SummaryPanel summary={summary} />

        <DateMismatchSection
          entries={categorized.dateMismatch}
          summary={summary.dateMismatch}
        />
        <DomainExistsMissingNftSection
          entries={categorized.domainExistsMissingNft}
          summary={summary.domainExistsMissingNft}
        />
        <NftExistsMissingDomainSection
          entries={categorized.nftExistsMissingDomainNotExpired}
          summary={summary.nftExistsMissingDomainNotExpired}
        />
        <ExpiredSection
          entries={categorized.expired}
          summary={summary.expired}
        />

        <Hr style={hr} />
        <Text style={caption}>
          This report is generated automatically. Acknowledged rows have a
          persisted explanation (managed via the NFT admin known-issues
          endpoints).
        </Text>
      </NamefiEmailContainer>
    );
  },
  {
    title: '2026-04-15 Comprehensive NFT Management Report',
    summary: {
      totalNfts: 12_847,
      dateMismatch: { total: 3, acknowledged: 0, needsReview: 3 },
      domainExistsMissingNft: { total: 2, acknowledged: 1, needsReview: 1 },
      nftExistsMissingDomainNotExpired: {
        total: 1,
        acknowledged: 0,
        needsReview: 1,
      },
      expired: { total: 27, acknowledged: 0, needsReview: 27 },
      knownIssuesTotal: 1,
    },
    categorized: {
      dateMismatch: [
        {
          normalizedDomainName: 'mismatch-one.com',
          chainId: 1,
          ownerAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
          registrarKey: 'Dynadot',
          nftExpirationTime: '2026-08-12T00:00:00.000Z',
          domainExpirationTime: '2026-09-01T00:00:00.000Z',
          expirationDiffSeconds: -1_728_000,
          isExpired: false,
        },
        {
          normalizedDomainName: 'mismatch-two.io',
          chainId: 8453,
          ownerAddress: '0x0123456789abcdef0123456789abcdef01234567',
          registrarKey: 'Route 53',
          nftExpirationTime: '2027-01-15T00:00:00.000Z',
          domainExpirationTime: '2026-12-30T00:00:00.000Z',
          expirationDiffSeconds: 1_468_800,
          isExpired: false,
        },
      ],
      domainExistsMissingNft: [
        {
          normalizedDomainName: 'votingsecurities.com',
          registrarKey: 'Dynadot',
          nftExpirationTime: null,
          domainExpirationTime: '2026-11-04T00:00:00.000Z',
          isExpired: false,
          knownIssue: {
            normalizedDomainName: 'votingsecurities.com',
            explanation:
              "User didn't provide an address that implements IERC721Receiver; NFT cannot be minted to their wallet.",
            category: 'DOMAIN_EXISTS_MISSING_NFT',
            acknowledgedBy: 'sami@d3serve.xyz',
            acknowledgedAt: '2026-03-22T11:24:00.000Z',
            updatedAt: '2026-03-22T11:24:00.000Z',
          },
        },
        {
          normalizedDomainName: 'unminted-active.io',
          registrarKey: 'Route 53',
          nftExpirationTime: null,
          domainExpirationTime: '2026-06-30T00:00:00.000Z',
          isExpired: false,
        },
      ],
      nftExistsMissingDomainNotExpired: [
        {
          normalizedDomainName: 'orphan-nft.org',
          chainId: 1,
          ownerAddress: '0xfeedfacecafebeefdeadbeef00112233aabbccdd',
          registrarKey: null,
          nftExpirationTime: '2026-12-15T00:00:00.000Z',
          domainExpirationTime: null,
          isExpired: false,
        },
      ],
      expired: Array.from({ length: 12 }).map((_, i) => ({
        normalizedDomainName: `expired-${i + 1}.com`,
        chainId: 1,
        ownerAddress: '0x0000000000000000000000000000000000000000',
        registrarKey: 'Dynadot',
        nftExpirationTime: '2025-09-01T00:00:00.000Z',
        domainExpirationTime: '2025-09-15T00:00:00.000Z',
        isExpired: true,
      })),
    },
    meta: {
      generatedAt: '2026-04-15T14:00:00.000Z',
      adminUrl: 'https://astra.namefi.io/admin/nft-management',
      githubActionsUrl: 'https://github.com/d3servelabs/namefi-astra/actions',
    },
  },
);

export default NftManagementReport;
