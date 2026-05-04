// biome-ignore lint/correctness/noUnusedImports: required for react-email runtime JSX
import React, { type CSSProperties } from 'react';
import { Button, Text } from '@react-email/components';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import {
  astraTheme,
  button,
  inlineActionLink,
  lineHeights,
  monospaceText,
  paragraph,
  sectionHeading,
  typeScale,
} from '../styles';
import { getDomainTrafficSurgeVariant } from '../campaigns/domain-traffic-surge-variants';

export type DomainTrafficSurgeProps = {
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  variant?: number;
  domains: Array<{
    domain: NamefiNormalizedDomain;
    weeklyQueries: number;
  }>;
  suggestedDomains?: NamefiNormalizedDomain[];
};

type TrafficDomain = DomainTrafficSurgeProps['domains'][number];

const summaryStyles = {
  panelTable: {
    borderCollapse: 'separate',
    borderSpacing: '0',
    margin: '16px 0 18px',
    width: '100%',
  },
  panelCell: {
    backgroundColor: astraTheme.surface,
    border: `1px solid ${astraTheme.infoBorder}`,
    padding: '18px 20px 20px',
  },
  label: {
    color: astraTheme.infoInk,
    fontSize: typeScale.xs,
    fontWeight: 700,
    letterSpacing: '0.04em',
    lineHeight: lineHeights.xs,
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  metric: {
    color: astraTheme.textPrimary,
    fontSize: '34px',
    fontWeight: 800,
    lineHeight: '40px',
    margin: '0',
  },
  meta: {
    color: astraTheme.textSecondary,
    fontSize: typeScale.sm,
    lineHeight: lineHeights.sm,
    margin: '6px 0 0',
  },
  topDomainTable: {
    borderCollapse: 'separate',
    borderSpacing: '0',
    marginTop: '14px',
    width: '100%',
  },
  topDomainCell: {
    backgroundColor: astraTheme.card,
    border: `1px solid ${astraTheme.border}`,
    borderLeft: `5px solid ${astraTheme.brandPrimary}`,
    padding: '12px 14px',
  },
  topDomainLabel: {
    color: astraTheme.textMuted,
    fontSize: typeScale.xs,
    fontWeight: 700,
    letterSpacing: '0.04em',
    lineHeight: lineHeights.xs,
    margin: '0 0 6px',
    textTransform: 'uppercase',
  },
  topDomainName: {
    ...monospaceText,
    color: astraTheme.textPrimary,
    fontSize: typeScale.md,
    fontWeight: 700,
    lineHeight: lineHeights.md,
    margin: '0',
  },
  topDomainMetric: {
    color: astraTheme.textMuted,
    fontSize: typeScale.sm,
    lineHeight: lineHeights.sm,
    margin: '4px 0 0',
  },
} satisfies Record<string, CSSProperties>;

const domainCardStyles = {
  listTable: {
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
    margin: '0 0 8px',
    width: '100%',
  },
  cardCell: {
    backgroundColor: astraTheme.card,
    border: `1px solid ${astraTheme.border}`,
    borderLeft: `5px solid ${astraTheme.brandPrimary}`,
    padding: '13px 14px',
  },
  cardInnerTable: {
    borderCollapse: 'collapse',
    width: '100%',
  },
  rankCell: {
    padding: '0 12px 0 0',
    verticalAlign: 'top',
    width: '42px',
  },
  contentCell: {
    padding: '0',
    verticalAlign: 'top',
  },
  rankText: {
    backgroundColor: astraTheme.warningBackground,
    border: `1px solid ${astraTheme.warningBorder}`,
    color: astraTheme.warningInk,
    display: 'inline-block',
    fontSize: typeScale.xs,
    fontWeight: 700,
    lineHeight: lineHeights.xs,
    margin: '0 0 8px',
    padding: '2px 8px',
  },
  domain: {
    ...monospaceText,
    color: astraTheme.textPrimary,
    fontSize: typeScale.md,
    fontWeight: 700,
    lineHeight: lineHeights.md,
    margin: '0',
  },
  metric: {
    color: astraTheme.textPrimary,
    fontSize: typeScale.lg,
    fontWeight: 800,
    lineHeight: lineHeights.lg,
    margin: '6px 0 0',
  },
} satisfies Record<string, CSSProperties>;

const suggestionStyles = {
  listTable: {
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
    margin: '0 0 4px',
    width: '100%',
  },
  cardCell: {
    backgroundColor: astraTheme.surfaceStripe,
    border: `1px solid ${astraTheme.border}`,
    padding: '12px 14px',
  },
  cardInnerTable: {
    borderCollapse: 'collapse',
    width: '100%',
  },
  domainCell: {
    padding: '0 12px 0 0',
    verticalAlign: 'middle',
  },
  actionCell: {
    padding: '0',
    textAlign: 'right',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    width: '96px',
  },
  domain: {
    ...monospaceText,
    color: astraTheme.textPrimary,
    fontSize: typeScale.md,
    fontWeight: 700,
    lineHeight: lineHeights.md,
    margin: '0 0 10px',
  },
  action: {
    ...inlineActionLink,
  },
} satisfies Record<string, CSSProperties>;

const TRAILING_ZERO_DECIMAL_REGEX = /\.0$/;

export function normalizeTrafficQueryCount(value: number) {
  return Math.max(0, Math.round(value));
}

export function formatCompactTrafficQueryCount(value: number) {
  const count = normalizeTrafficQueryCount(value);
  if (count >= 1_000_000) {
    const formatted = (count / 1_000_000).toFixed(1);
    return `${formatted.replace(TRAILING_ZERO_DECIMAL_REGEX, '')}M`;
  }
  if (count >= 10_000) {
    return `${Math.round(count / 1_000).toLocaleString('en-US')}k`;
  }
  if (count >= 1_000) {
    const formatted = (count / 1_000).toFixed(1);
    return `${formatted.replace(TRAILING_ZERO_DECIMAL_REGEX, '')}k`;
  }
  return count.toLocaleString('en-US');
}

export function formatLookupMetric(value: number) {
  const unit = normalizeTrafficQueryCount(value) === 1 ? 'lookup' : 'lookups';
  return `${formatCompactTrafficQueryCount(value)} ${unit}`;
}

export function formatDomainCountLabel(value: number) {
  return value === 1 ? '1 domain' : `${value} domains`;
}

function getTrafficEmailTitle({
  topDomain,
  hasMultipleTrafficDomains,
  totalWeeklyQueries,
  domainCount,
  fallbackSubject,
}: {
  topDomain: TrafficDomain | null;
  hasMultipleTrafficDomains: boolean;
  totalWeeklyQueries: number;
  domainCount: number;
  fallbackSubject: string;
}) {
  if (!topDomain) return fallbackSubject;
  const trafficSummary = hasMultipleTrafficDomains
    ? `${formatLookupMetric(totalWeeklyQueries)} across ${formatDomainCountLabel(domainCount)}`
    : `${formatLookupMetric(topDomain.weeklyQueries)} for ${topDomain.domain}`;
  if (hasMultipleTrafficDomains) {
    return `Your domains are heating up: Namefi measured ${trafficSummary}`;
  }
  return `Your domain is heating up: Namefi measured ${trafficSummary}`;
}

export function getDomainTrafficSurgeEmailTitle({
  domains,
  fallbackSubject,
}: {
  domains: DomainTrafficSurgeProps['domains'];
  fallbackSubject: string;
}) {
  const sortedDomains = [...domains].sort(
    (a, b) => b.weeklyQueries - a.weeklyQueries,
  );
  const topDomain = sortedDomains[0] ?? null;
  const totalWeeklyQueries = sortedDomains.reduce(
    (total, item) => total + normalizeTrafficQueryCount(item.weeklyQueries),
    0,
  );

  return getTrafficEmailTitle({
    topDomain,
    hasMultipleTrafficDomains: sortedDomains.length > 1,
    totalWeeklyQueries,
    domainCount: sortedDomains.length,
    fallbackSubject,
  });
}

export function getSuggestedDomainsHeading() {
  return 'Similar domains to the ones heating up';
}

function TrafficSummaryPanel({
  topDomain,
  hasMultipleTrafficDomains,
  totalWeeklyQueries,
  domainCount,
}: {
  topDomain: TrafficDomain;
  hasMultipleTrafficDomains: boolean;
  totalWeeklyQueries: number;
  domainCount: number;
}) {
  const measuredMetric = hasMultipleTrafficDomains
    ? formatLookupMetric(totalWeeklyQueries)
    : formatLookupMetric(topDomain.weeklyQueries);
  const measuredScope = hasMultipleTrafficDomains
    ? `across ${formatDomainCountLabel(domainCount)}`
    : `for ${topDomain.domain}`;

  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      style={summaryStyles.panelTable}
    >
      <tbody>
        <tr>
          <td style={summaryStyles.panelCell}>
            <Text style={summaryStyles.label}>Activity measured</Text>
            <Text style={summaryStyles.metric}>{measuredMetric}</Text>
            <Text style={summaryStyles.meta}>
              Namefi recorded this activity {measuredScope} in the latest 7-day
              window.
            </Text>
            {!hasMultipleTrafficDomains ? (
              <table
                role="presentation"
                cellPadding="0"
                cellSpacing="0"
                style={summaryStyles.topDomainTable}
              >
                <tbody>
                  <tr>
                    <td style={summaryStyles.topDomainCell}>
                      <Text style={summaryStyles.topDomainLabel}>
                        Active domain
                      </Text>
                      <Text style={summaryStyles.topDomainName}>
                        {topDomain.domain}
                      </Text>
                      <Text style={summaryStyles.topDomainMetric}>
                        {formatLookupMetric(topDomain.weeklyQueries)}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function MeasuredDomainCards({ domains }: { domains: TrafficDomain[] }) {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      style={domainCardStyles.listTable}
    >
      <tbody>
        {domains.map((domain, index) => (
          <tr key={domain.domain}>
            <td style={domainCardStyles.cardCell}>
              <table
                role="presentation"
                cellPadding="0"
                cellSpacing="0"
                style={domainCardStyles.cardInnerTable}
              >
                <tbody>
                  <tr>
                    <td style={domainCardStyles.rankCell}>
                      <Text style={domainCardStyles.rankText}>
                        #{index + 1}
                      </Text>
                    </td>
                    <td style={domainCardStyles.contentCell}>
                      <Text style={domainCardStyles.domain}>
                        {domain.domain}
                      </Text>
                      <Text style={domainCardStyles.metric}>
                        {formatLookupMetric(domain.weeklyQueries)}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TrafficActivitySection({
  domains,
  topDomain,
  hasMultipleTrafficDomains,
  totalWeeklyQueries,
  poweredByNamefiDomain,
  cta,
}: {
  domains: TrafficDomain[];
  topDomain: TrafficDomain;
  hasMultipleTrafficDomains: boolean;
  totalWeeklyQueries: number;
  poweredByNamefiDomain: string | null;
  cta: string;
}) {
  const heatingIntro = hasMultipleTrafficDomains
    ? 'Your domains are heating up.'
    : 'Your domain is heating up.';

  return (
    <>
      <Text style={{ ...paragraph, marginBottom: '12px' }}>
        {heatingIntro} Here is what Namefi measured in the latest 7-day window.
      </Text>
      <TrafficSummaryPanel
        topDomain={topDomain}
        hasMultipleTrafficDomains={hasMultipleTrafficDomains}
        totalWeeklyQueries={totalWeeklyQueries}
        domainCount={domains.length}
      />
      {hasMultipleTrafficDomains ? (
        <>
          <Text style={sectionHeading}>Most active domains</Text>
          <MeasuredDomainCards domains={domains} />
        </>
      ) : null}
      <Button
        className="namefi-button-mobile"
        style={button}
        href={NamefiEmailLinks.domains({ poweredByNamefiDomain })}
      >
        {cta}
      </Button>
    </>
  );
}

function SuggestedDomainsSection({
  domains,
  poweredByNamefiDomain,
}: {
  domains: NamefiNormalizedDomain[];
  poweredByNamefiDomain: string | null;
}) {
  return (
    <>
      <Text style={sectionHeading}>{getSuggestedDomainsHeading()}</Text>
      <table
        role="presentation"
        cellPadding="0"
        cellSpacing="0"
        style={suggestionStyles.listTable}
      >
        <tbody>
          {domains.map((domain) => (
            <tr key={domain}>
              <td style={suggestionStyles.cardCell}>
                <table
                  role="presentation"
                  cellPadding="0"
                  cellSpacing="0"
                  style={suggestionStyles.cardInnerTable}
                >
                  <tbody>
                    <tr>
                      <td style={suggestionStyles.domainCell}>
                        <Text style={suggestionStyles.domain}>{domain}</Text>
                      </td>
                      <td style={suggestionStyles.actionCell}>
                        <a
                          aria-label={`Register ${domain}`}
                          href={NamefiEmailLinks.addToCartFromUrl({
                            domain,
                            poweredByNamefiDomain,
                          })}
                          style={suggestionStyles.action}
                        >
                          Register
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export const DomainTrafficSurgeTemplate = (props: DomainTrafficSurgeProps) => {
  const poweredByNamefiDomain = usePoweredByNamefiDomain(
    props.poweredByNamefiDomain,
  );
  const safeRecipientName = props.recipientName?.trim()
    ? props.recipientName
    : 'there';
  const { variant: copyVariant } = getDomainTrafficSurgeVariant(
    props.variant ?? 0,
  );

  const sortedDomains = [...props.domains].sort(
    (a, b) => b.weeklyQueries - a.weeklyQueries,
  );
  const topDomain = sortedDomains[0] ?? null;
  const hasMultipleTrafficDomains = sortedDomains.length > 1;
  const totalWeeklyQueries = sortedDomains.reduce(
    (total, item) => total + normalizeTrafficQueryCount(item.weeklyQueries),
    0,
  );
  const emailTitle = getDomainTrafficSurgeEmailTitle({
    domains: sortedDomains,
    fallbackSubject: copyVariant.subject,
  });
  const suggestedDomains = props.suggestedDomains ?? [];

  return (
    <NamefiEmailContainer title={emailTitle} headerSubtitle={false}>
      <Text style={{ ...paragraph, marginBottom: '12px' }}>
        Hi {safeRecipientName},
      </Text>
      {topDomain ? (
        <TrafficActivitySection
          domains={sortedDomains}
          topDomain={topDomain}
          hasMultipleTrafficDomains={hasMultipleTrafficDomains}
          totalWeeklyQueries={totalWeeklyQueries}
          poweredByNamefiDomain={poweredByNamefiDomain}
          cta={copyVariant.cta}
        />
      ) : null}
      {suggestedDomains.length > 0 ? (
        <SuggestedDomainsSection
          domains={suggestedDomains}
          poweredByNamefiDomain={poweredByNamefiDomain}
        />
      ) : null}
    </NamefiEmailContainer>
  );
};

export const domainTrafficSurgePreviewBase: DomainTrafficSurgeProps = {
  recipientName: 'Jordan',
  recipientEmail: 'jordan@example.com',
  variant: 0,
  poweredByNamefiDomain: null,
  domains: [
    {
      domain: namefiNormalizedDomainSchema.parse('brightlabs.com'),
      weeklyQueries: 94_320,
    },
    {
      domain: namefiNormalizedDomainSchema.parse('brightlabs.io'),
      weeklyQueries: 41_880,
    },
  ],
  suggestedDomains: [
    namefiNormalizedDomainSchema.parse('brightlabshq.com'),
    namefiNormalizedDomainSchema.parse('brightlabsteam.com'),
  ],
};
