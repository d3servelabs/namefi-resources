import type React from 'react';
import type { CSSProperties } from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import {
  EmailTrackingPixel,
  useEmailTrackingUrl,
} from '../components/email-tracking';
import { EmailIconButton } from '../components/email-action-icon';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
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
  leadgen?: {
    runId: string;
    sourceDomain: NamefiNormalizedDomain;
    leads: Array<{
      leadId: string;
      businessDomain: string;
      rationale: string;
      hasDraft?: boolean;
    }>;
  };
};

type TrafficDomain = DomainTrafficSurgeProps['domains'][number];

const TRAFFIC_SURGE_LEAD_LIMIT = 5;

const trafficColors = {
  void: '#05090E',
  panel: '#0D141C',
  panelDeep: '#0A1118',
  card: '#FCFEFF',
  cardSoft: '#F2F6FA',
  green: '#1CD17D',
  greenStrong: '#14B86D',
  text: '#FFFFFF',
  textInverse: '#05090E',
  muted: '#8A9BAE',
  mutedInverse: '#5A6B7C',
  border: 'rgba(255, 255, 255, 0.07)',
  greenBorder: 'rgba(28, 209, 125, 0.32)',
  greenGlow: 'rgba(28, 209, 125, 0.18)',
} as const;

const trafficSurgeResponsiveCss = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap');

.traffic-surge-body {
  margin: 0;
}

@media only screen and (max-width: 620px) {
  .traffic-surge-body {
    box-sizing: border-box !important;
    padding: 16px 8px 24px !important;
    width: auto !important;
  }

  .traffic-surge-shell {
    border-radius: 14px !important;
  }

  .traffic-surge-hero {
    padding: 54px 20px 44px !important;
  }

  .traffic-surge-hero-number {
    font-size: 74px !important;
    line-height: 78px !important;
  }

  .traffic-surge-hero-number-suffix {
    font-size: 54px !important;
    line-height: 58px !important;
  }

  .traffic-surge-hero-title {
    font-size: 24px !important;
    line-height: 30px !important;
  }

  .traffic-surge-section {
    padding: 30px 20px 18px !important;
  }

  .traffic-surge-grid-table,
  .traffic-surge-grid-table tbody,
  .traffic-surge-grid-table tr {
    display: block !important;
    width: 100% !important;
  }

  .traffic-surge-grid-column {
    box-sizing: border-box !important;
    display: block !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    width: 100% !important;
  }

  .traffic-surge-domain-card {
    min-height: 0 !important;
  }

  .traffic-surge-domain-name {
    font-size: 18px !important;
    line-height: 24px !important;
  }

  .traffic-surge-domain-name,
  .traffic-surge-suggestion-domain,
  .traffic-surge-lead-domain {
    white-space: normal !important;
  }

  .traffic-surge-lead-table,
  .traffic-surge-lead-table tbody,
  .traffic-surge-lead-table tr,
  .traffic-surge-lead-main,
  .traffic-surge-lead-action-cell {
    display: block !important;
    width: 100% !important;
  }

  .traffic-surge-lead-action-cell {
    box-sizing: border-box !important;
    padding: 12px 0 0 !important;
    text-align: left !important;
  }

  .traffic-surge-lead-action {
    box-sizing: border-box !important;
    display: block !important;
    width: 100% !important;
  }
}
`;

const emailShellStyles = {
  body: {
    backgroundColor: trafficColors.void,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    padding: '30px 12px 36px',
  },
  container: {
    backgroundColor: trafficColors.void,
    border: `1px solid ${trafficColors.border}`,
    borderRadius: '24px',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
    margin: '0 auto',
    maxWidth: '640px',
    overflow: 'hidden',
    padding: '0',
    width: '100%',
  },
} satisfies Record<string, CSSProperties>;

const trafficSurgeStyles = {
  hero: {
    backgroundColor: trafficColors.void,
    backgroundImage:
      'radial-gradient(circle at 50% 26%, rgba(28, 209, 125, 0.18) 0%, rgba(28, 209, 125, 0.08) 34%, rgba(5, 9, 14, 0) 68%)',
    overflow: 'hidden',
    padding: '74px 36px 58px',
    position: 'relative',
    textAlign: 'center',
  },
  heroSvg: {
    height: '100%',
    left: '0',
    position: 'absolute',
    top: '0',
    width: '100%',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  eyebrow: {
    backgroundColor: 'rgba(28, 209, 125, 0.12)',
    border: '1px solid rgba(28, 209, 125, 0.28)',
    borderRadius: '999px',
    color: trafficColors.green,
    display: 'inline-block',
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '13px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    lineHeight: '18px',
    margin: '0 0 24px',
    padding: '7px 16px',
    textTransform: 'uppercase',
  },
  eyebrowDot: {
    backgroundColor: trafficColors.green,
    borderRadius: '50%',
    boxShadow: `0 0 10px ${trafficColors.green}`,
    display: 'inline-block',
    height: '8px',
    margin: '0 10px 1px 0',
    verticalAlign: 'middle',
    width: '8px',
  },
  heroNumber: {
    color: '#EAF2FA',
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '108px',
    fontWeight: 900,
    letterSpacing: '0',
    lineHeight: '108px',
    margin: '0',
    textShadow: '0 10px 28px rgba(0, 0, 0, 0.45)',
  },
  heroNumberSuffix: {
    color: trafficColors.green,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '78px',
    fontWeight: 900,
    letterSpacing: '0',
    lineHeight: '82px',
    verticalAlign: 'baseline',
  },
  heroTitle: {
    color: trafficColors.text,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: '32px',
    margin: '12px 0 0',
  },
  heroCopy: {
    color: trafficColors.muted,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '18px auto 0',
    maxWidth: '420px',
  },
  section: {
    backgroundColor: trafficColors.panel,
    borderTop: `1px solid ${trafficColors.border}`,
    padding: '42px 40px 24px',
  },
  sectionDeep: {
    backgroundColor: trafficColors.panelDeep,
    borderTop: `1px solid ${trafficColors.greenBorder}`,
    padding: '42px 40px 24px',
  },
  sectionHeading: {
    color: trafficColors.text,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '23px',
    fontWeight: 800,
    lineHeight: '30px',
    margin: '0 0 24px',
  },
  gridTable: {
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    width: '100%',
  },
  domainCard: {
    backgroundColor: trafficColors.card,
    backgroundImage: `linear-gradient(145deg, ${trafficColors.card} 0%, ${trafficColors.cardSoft} 100%)`,
    border: `1px solid ${trafficColors.greenBorder}`,
    borderRadius: '14px',
    boxShadow: `0 12px 34px ${trafficColors.greenGlow}`,
    height: '176px',
    overflow: 'hidden',
    tableLayout: 'fixed',
    width: '100%',
  },
  domainCardCell: {
    height: '176px',
    padding: '18px 20px',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  rankBadge: {
    borderRadius: '999px',
    display: 'inline-block',
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    lineHeight: '18px',
    margin: '0 0 12px',
    padding: '5px 15px',
    textTransform: 'uppercase',
  },
  domainName: {
    color: trafficColors.textInverse,
    fontFamily:
      '"JetBrains Mono","SFMono-Regular",Consolas,"Liberation Mono","Courier New",monospace',
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '0',
    lineHeight: '22px',
    margin: '0',
    overflowWrap: 'normal',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
  },
  domainHeaderFrameTable: {
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    width: '100%',
  },
  domainHeaderFrameSideCell: {
    padding: '0',
    verticalAlign: 'middle',
    width: '42px',
  },
  domainHeaderFrameCenterCell: {
    padding: '0',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  domainHeaderTable: {
    borderCollapse: 'collapse',
    width: 'auto',
  },
  domainHeaderNameCell: {
    padding: '0 12px 0 0',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  domainHeaderActionCell: {
    padding: '0',
    textAlign: 'right',
    verticalAlign: 'middle',
    width: '36px',
  },
  manageAction: {
    backgroundColor: trafficColors.green,
    border: `1px solid ${trafficColors.greenStrong}`,
    borderRadius: '8px',
    color: trafficColors.textInverse,
    display: 'inline-block',
    height: '34px',
    lineHeight: '34px',
    padding: '0',
    textAlign: 'center',
    textDecoration: 'none',
    width: '34px',
  },
  domainMetric: {
    color: trafficColors.textInverse,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '15px',
    fontWeight: 800,
    lineHeight: '24px',
    margin: '14px 0 0',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  domainMetricValue: {
    color: '#02060A',
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '40px',
    fontWeight: 900,
    letterSpacing: '0',
    lineHeight: '42px',
  },
  domainMetricLabel: {
    color: trafficColors.mutedInverse,
    fontSize: '14px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    lineHeight: '18px',
    paddingLeft: '8px',
    verticalAlign: 'baseline',
  },
  suggestionCard: {
    backgroundColor: trafficColors.card,
    border: '1px solid rgba(5, 9, 14, 0.08)',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    height: '82px',
    overflow: 'hidden',
    tableLayout: 'fixed',
    width: '100%',
  },
  suggestionCell: {
    height: '82px',
    padding: '12px 20px',
    verticalAlign: 'middle',
  },
  suggestionInnerTable: {
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    width: '100%',
  },
  suggestionDomainCell: {
    padding: '0 14px 0 0',
    verticalAlign: 'middle',
    width: '1%',
    whiteSpace: 'nowrap',
  },
  suggestionSpacerCell: {
    padding: '0',
    verticalAlign: 'middle',
    width: '100%',
  },
  suggestionActionCell: {
    padding: '0',
    textAlign: 'right',
    verticalAlign: 'middle',
    width: '52px',
  },
  suggestionDomain: {
    color: trafficColors.textInverse,
    fontFamily:
      '"JetBrains Mono","SFMono-Regular",Consolas,"Liberation Mono","Courier New",monospace',
    fontSize: '16px',
    fontWeight: 800,
    lineHeight: '24px',
    margin: '0',
    overflowWrap: 'normal',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
  },
  suggestionAction: {
    backgroundColor: trafficColors.green,
    border: `1px solid ${trafficColors.greenStrong}`,
    borderRadius: '9px',
    color: trafficColors.textInverse,
    display: 'inline-block',
    height: '42px',
    lineHeight: '42px',
    padding: '0',
    textAlign: 'center',
    textDecoration: 'none',
    width: '42px',
  },
  leadIntro: {
    color: trafficColors.muted,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '15px',
    lineHeight: '22px',
    margin: '-12px 0 22px',
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${trafficColors.greenBorder}`,
    borderRadius: '14px',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.16)',
    overflow: 'hidden',
    tableLayout: 'fixed',
    width: '100%',
  },
  leadCell: {
    padding: '16px 18px',
    verticalAlign: 'middle',
  },
  leadInnerTable: {
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    width: '100%',
  },
  leadMainCell: {
    padding: '0 16px 0 0',
    verticalAlign: 'middle',
    width: '100%',
  },
  leadActionCell: {
    padding: '0',
    textAlign: 'right',
    verticalAlign: 'middle',
    width: '116px',
  },
  leadDomain: {
    color: trafficColors.textInverse,
    fontFamily:
      '"JetBrains Mono","SFMono-Regular",Consolas,"Liberation Mono","Courier New",monospace',
    fontSize: '16px',
    fontWeight: 800,
    lineHeight: '22px',
    margin: '0 0 5px',
    overflowWrap: 'anywhere',
    wordBreak: 'normal',
  },
  leadRationale: {
    color: trafficColors.mutedInverse,
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '13px',
    lineHeight: '19px',
    margin: '0',
  },
  leadAction: {
    backgroundColor: trafficColors.green,
    border: `1px solid ${trafficColors.greenStrong}`,
    borderRadius: '9px',
    color: trafficColors.textInverse,
    display: 'inline-block',
    fontFamily:
      '"Outfit","Avenir Next","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    fontSize: '13px',
    fontWeight: 900,
    lineHeight: '40px',
    padding: '0 15px',
    textAlign: 'center',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  footer: {
    backgroundColor: trafficColors.void,
    borderTop: `1px solid ${trafficColors.border}`,
    padding: '34px 40px 38px',
    textAlign: 'center',
  },
  footerText: {
    color: trafficColors.muted,
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0',
  },
  footerLink: {
    color: trafficColors.green,
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: '20px',
    textDecoration: 'underline',
  },
} satisfies Record<string, CSSProperties>;

const rankBadgeVariants = [
  {
    backgroundColor: '#FFC928',
    boxShadow: '0 6px 16px rgba(255, 201, 40, 0.32)',
    color: '#05090E',
  },
  {
    backgroundColor: '#C8CED6',
    boxShadow: '0 6px 16px rgba(200, 206, 214, 0.34)',
    color: '#05090E',
  },
  {
    backgroundColor: '#C7782D',
    boxShadow: '0 6px 16px rgba(199, 120, 45, 0.32)',
    color: '#FFFFFF',
  },
  {
    backgroundColor: '#7F91A4',
    boxShadow: '0 6px 16px rgba(127, 145, 164, 0.28)',
    color: '#FFFFFF',
  },
] satisfies CSSProperties[];

const defaultRankBadgeVariant: CSSProperties = rankBadgeVariants[3] ?? {};

const TRAILING_ZERO_DECIMAL_REGEX = /\.0$/;
const COMPACT_METRIC_PARTS_REGEX = /^([0-9.,]+)([a-zA-Z]+)$/;

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
  return 'Similar domains available';
}

function getLookupUnit(value: number) {
  return normalizeTrafficQueryCount(value) === 1 ? 'lookup' : 'lookups';
}

function splitCompactMetric(value: number) {
  const formatted = formatCompactTrafficQueryCount(value);
  const match = formatted.match(COMPACT_METRIC_PARTS_REGEX);
  if (!match) {
    return { value: formatted, suffix: '' };
  }
  return { value: match[1] ?? formatted, suffix: match[2] ?? '' };
}

function getHeroCopy({
  hasMultipleTrafficDomains,
  recipientName,
}: {
  hasMultipleTrafficDomains: boolean;
  recipientName: string | null;
}) {
  const scope = hasMultipleTrafficDomains ? 'domains are' : 'domain is';
  const baseCopy = `Congratulations! Your ${scope} popular.`;
  if (!recipientName) return baseCopy;
  return `${recipientName}, ${baseCopy.charAt(0).toLowerCase()}${baseCopy.slice(1)}`;
}

function getTopDomainsHeading(domainCount: number) {
  return domainCount === 1 ? 'Top Performing Domain' : 'Top Performing Domains';
}

function formatOrdinalRank(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function getRankBadgeStyle(index: number): CSSProperties {
  return {
    ...trafficSurgeStyles.rankBadge,
    ...(rankBadgeVariants[index] ?? defaultRankBadgeVariant),
  };
}

function chunkIntoPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}

function getGridColumnStyle({
  cellIndex,
  isSingleCell,
}: {
  cellIndex: number;
  isSingleCell: boolean;
}): CSSProperties {
  if (isSingleCell) {
    return {
      padding: '0 0 16px',
      verticalAlign: 'top',
      width: '100%',
    };
  }

  return {
    padding: cellIndex === 0 ? '0 8px 16px 0' : '0 0 16px 8px',
    verticalAlign: 'top',
    width: '50%',
  };
}

function TrafficTileGrid<T>({
  items,
  getKey,
  renderItem,
}: {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const rows = chunkIntoPairs(items);
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      className="traffic-surge-grid-table"
      width="100%"
      style={trafficSurgeStyles.gridTable}
    >
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={row
              .map((item, cellIndex) => getKey(item, rowIndex * 2 + cellIndex))
              .join('|')}
          >
            {row.map((item, cellIndex) => {
              const itemIndex = rowIndex * 2 + cellIndex;
              return (
                <td
                  className="traffic-surge-grid-column"
                  key={getKey(item, itemIndex)}
                  width={row.length === 1 ? '100%' : '50%'}
                  style={getGridColumnStyle({
                    cellIndex,
                    isSingleCell: row.length === 1,
                  })}
                >
                  {renderItem(item, itemIndex)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HeroDecoration() {
  return (
    <svg
      aria-hidden="true"
      style={trafficSurgeStyles.heroSvg}
      viewBox="0 0 640 390"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 46H640M0 92H640M0 138H640M0 184H640M0 230H640M0 276H640M0 322H640"
        fill="none"
        opacity="0.58"
        stroke="rgba(255,255,255,0.05)"
      />
      <path
        d="M102 0V390M205 0V390M320 0V390M435 0V390M538 0V390"
        fill="none"
        opacity="0.58"
        stroke="rgba(255,255,255,0.05)"
      />
      <circle
        cx="320"
        cy="178"
        fill="none"
        opacity="0.5"
        r="132"
        stroke="rgba(255,255,255,0.08)"
      />
      <circle
        cx="320"
        cy="178"
        fill="none"
        opacity="0.44"
        r="220"
        stroke="rgba(255,255,255,0.08)"
      />
      <path
        d="M-58 238C105 238 192 112 278 154C366 198 382 267 470 272C542 276 586 276 698 318"
        fill="none"
        opacity="0.68"
        stroke="#1CD17D"
        strokeDasharray="7 9"
        strokeWidth="2.5"
      />
      <path
        d="M-64 74C58 121 172 108 261 118C371 130 382 270 488 212C565 170 590 170 704 200"
        fill="none"
        opacity="0.43"
        stroke="#1CD17D"
        strokeDasharray="7 9"
        strokeWidth="2.5"
      />
      <path
        d="M-46 290C114 276 185 214 265 180C352 142 438 128 514 126C584 124 628 136 694 150"
        fill="none"
        opacity="0.72"
        stroke="#1CD17D"
        strokeDasharray="7 9"
        strokeWidth="2.5"
      />
      <path
        d="M203 132L208 137L213 132L208 127Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <path
        d="M456 226L461 231L466 226L461 221Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <path d="M520 108L524 112L528 108L524 104Z" fill="#1CD17D" />
      <path d="M114 270L118 274L122 270L118 266Z" fill="#1CD17D" />
      <circle cx="96" cy="82" fill="#1CD17D" opacity="0.54" r="4" />
      <circle cx="541" cy="286" fill="#1CD17D" opacity="0.9" r="4" />
      <path
        d="M490 196L496 202M496 196L490 202"
        opacity="0.78"
        stroke="#1CD17D"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M166 304L171 309M171 304L166 309"
        opacity="0.44"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TrafficHero({
  hasMultipleTrafficDomains,
  recipientName,
  totalWeeklyQueries,
}: {
  hasMultipleTrafficDomains: boolean;
  recipientName: string | null;
  totalWeeklyQueries: number;
}) {
  const heroMetric = splitCompactMetric(totalWeeklyQueries);
  const heroCopy = getHeroCopy({
    hasMultipleTrafficDomains,
    recipientName,
  });

  return (
    <div className="traffic-surge-hero" style={trafficSurgeStyles.hero}>
      <HeroDecoration />
      <div style={trafficSurgeStyles.heroContent}>
        <div style={trafficSurgeStyles.eyebrow}>
          <span style={trafficSurgeStyles.eyebrowDot} />
          Weekly Report
        </div>
        <div
          className="traffic-surge-hero-number"
          style={trafficSurgeStyles.heroNumber}
        >
          {heroMetric.value}
          {heroMetric.suffix ? (
            <span
              className="traffic-surge-hero-number-suffix"
              style={trafficSurgeStyles.heroNumberSuffix}
            >
              {heroMetric.suffix}
            </span>
          ) : null}
        </div>
        <Text
          className="traffic-surge-hero-title"
          style={trafficSurgeStyles.heroTitle}
        >
          Total Domain Lookups
        </Text>
        <Text style={trafficSurgeStyles.heroCopy}>
          {heroCopy}
          <br />
          Keep the momentum going.
        </Text>
      </div>
    </div>
  );
}

function TopDomainCard({
  domain,
  index,
  poweredByNamefiDomain,
}: {
  domain: TrafficDomain;
  index: number;
  poweredByNamefiDomain: string | null;
}) {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      className="traffic-surge-domain-card"
      width="100%"
      style={trafficSurgeStyles.domainCard}
    >
      <tbody>
        <tr>
          <td style={trafficSurgeStyles.domainCardCell}>
            <div style={getRankBadgeStyle(index)}>
              {formatOrdinalRank(index + 1)}
            </div>
            <table
              role="presentation"
              cellPadding="0"
              cellSpacing="0"
              width="100%"
              style={trafficSurgeStyles.domainHeaderFrameTable}
            >
              <tbody>
                <tr>
                  <td
                    width="42"
                    style={trafficSurgeStyles.domainHeaderFrameSideCell}
                  />
                  <td
                    align="center"
                    style={trafficSurgeStyles.domainHeaderFrameCenterCell}
                  >
                    <table
                      role="presentation"
                      align="center"
                      cellPadding="0"
                      cellSpacing="0"
                      style={trafficSurgeStyles.domainHeaderTable}
                    >
                      <tbody>
                        <tr>
                          <td style={trafficSurgeStyles.domainHeaderNameCell}>
                            <Text
                              className="traffic-surge-domain-name"
                              style={trafficSurgeStyles.domainName}
                            >
                              {domain.domain}
                            </Text>
                          </td>
                          <td
                            width="36"
                            style={trafficSurgeStyles.domainHeaderActionCell}
                          >
                            <EmailIconButton
                              className="traffic-surge-manage-action"
                              href={NamefiEmailLinks.domainSettings({
                                domain: domain.domain,
                                poweredByNamefiDomain,
                              })}
                              icon="settings"
                              iconSize={18}
                              label={`Manage DNS for ${domain.domain}`}
                              style={trafficSurgeStyles.manageAction}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td
                    width="42"
                    style={trafficSurgeStyles.domainHeaderFrameSideCell}
                  />
                </tr>
              </tbody>
            </table>
            <Text style={trafficSurgeStyles.domainMetric}>
              <span style={trafficSurgeStyles.domainMetricValue}>
                {formatCompactTrafficQueryCount(domain.weeklyQueries)}
              </span>
              <span style={trafficSurgeStyles.domainMetricLabel}>
                {getLookupUnit(domain.weeklyQueries)}
              </span>
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function TopDomainsSection({
  domains,
  poweredByNamefiDomain,
}: {
  domains: TrafficDomain[];
  poweredByNamefiDomain: string | null;
}) {
  return (
    <div className="traffic-surge-section" style={trafficSurgeStyles.section}>
      <Text style={trafficSurgeStyles.sectionHeading}>
        {getTopDomainsHeading(domains.length)}
      </Text>
      <TrafficTileGrid
        getKey={(domain) => domain.domain}
        items={domains}
        renderItem={(domain, index) => (
          <TopDomainCard
            domain={domain}
            index={index}
            poweredByNamefiDomain={poweredByNamefiDomain}
          />
        )}
      />
    </div>
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
    <div
      className="traffic-surge-section"
      style={trafficSurgeStyles.sectionDeep}
    >
      <Text style={trafficSurgeStyles.sectionHeading}>
        {getSuggestedDomainsHeading()}
      </Text>
      <TrafficTileGrid
        getKey={(domain) => domain}
        items={domains}
        renderItem={(domain) => (
          <table
            role="presentation"
            cellPadding="0"
            cellSpacing="0"
            width="100%"
            style={trafficSurgeStyles.suggestionCard}
          >
            <tbody>
              <tr>
                <td style={trafficSurgeStyles.suggestionCell}>
                  <table
                    role="presentation"
                    cellPadding="0"
                    cellSpacing="0"
                    width="100%"
                    style={trafficSurgeStyles.suggestionInnerTable}
                  >
                    <tbody>
                      <tr>
                        <td
                          width="1%"
                          style={trafficSurgeStyles.suggestionDomainCell}
                        >
                          <Text
                            className="traffic-surge-suggestion-domain"
                            style={trafficSurgeStyles.suggestionDomain}
                          >
                            {domain}
                          </Text>
                        </td>
                        <td
                          width="100%"
                          style={trafficSurgeStyles.suggestionSpacerCell}
                        />
                        <td
                          align="right"
                          width="52"
                          style={trafficSurgeStyles.suggestionActionCell}
                        >
                          <EmailIconButton
                            className="traffic-surge-suggestion-action"
                            href={NamefiEmailLinks.addToCartFromUrl({
                              domain,
                              poweredByNamefiDomain,
                            })}
                            icon="cart"
                            iconSize={22}
                            label={`Add ${domain} to cart`}
                            style={trafficSurgeStyles.suggestionAction}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      />
    </div>
  );
}

function LeadgenSection({
  leadgen,
  poweredByNamefiDomain,
}: {
  leadgen: NonNullable<DomainTrafficSurgeProps['leadgen']>;
  poweredByNamefiDomain: string | null;
}) {
  const leads = leadgen.leads.slice(0, TRAFFIC_SURGE_LEAD_LIMIT);

  return (
    <div
      className="traffic-surge-section"
      style={trafficSurgeStyles.sectionDeep}
    >
      <Text style={trafficSurgeStyles.sectionHeading}>
        Buyers to approach for {leadgen.sourceDomain}
      </Text>
      <Text style={trafficSurgeStyles.leadIntro}>
        Namefi Outbound found companies that could have a practical reason to
        upgrade to this domain.
      </Text>
      <div>
        {leads.map((lead, index) => (
          <table
            key={lead.leadId}
            role="presentation"
            cellPadding="0"
            cellSpacing="0"
            width="100%"
            style={{
              ...trafficSurgeStyles.leadCard,
              margin: index === leads.length - 1 ? '0' : '0 0 12px',
            }}
          >
            <tbody>
              <tr>
                <td style={trafficSurgeStyles.leadCell}>
                  <table
                    role="presentation"
                    cellPadding="0"
                    cellSpacing="0"
                    className="traffic-surge-lead-table"
                    width="100%"
                    style={trafficSurgeStyles.leadInnerTable}
                  >
                    <tbody>
                      <tr>
                        <td
                          className="traffic-surge-lead-main"
                          style={trafficSurgeStyles.leadMainCell}
                        >
                          <Text
                            className="traffic-surge-lead-domain"
                            style={trafficSurgeStyles.leadDomain}
                          >
                            {lead.businessDomain}
                          </Text>
                          <Text style={trafficSurgeStyles.leadRationale}>
                            {lead.rationale}
                          </Text>
                        </td>
                        <td
                          align="right"
                          className="traffic-surge-lead-action-cell"
                          style={trafficSurgeStyles.leadActionCell}
                        >
                          <a
                            aria-label={`View outbound lead for ${lead.businessDomain}`}
                            className="traffic-surge-lead-action"
                            href={NamefiEmailLinks.leadgenRun({
                              runId: leadgen.runId,
                              poweredByNamefiDomain,
                              extraSearchParams: {
                                lead: lead.leadId,
                                source: 'traffic-surge-email',
                              },
                            })}
                            style={trafficSurgeStyles.leadAction}
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}

function TrafficEmailFooter({
  poweredByNamefiDomain,
}: {
  poweredByNamefiDomain: string | null;
}) {
  return (
    <div style={trafficSurgeStyles.footer}>
      <Text style={trafficSurgeStyles.footerText}>
        This is an automated domain activity notification.
        <br />
        All metrics are accurate as of send time.
      </Text>
      <Text style={{ ...trafficSurgeStyles.footerText, margin: '14px 0 0' }}>
        <a
          href="mailto:support@namefi.io"
          style={trafficSurgeStyles.footerLink}
        >
          Contact support
        </a>
        {' | '}
        <a
          href={NamefiEmailLinks.emailSubscription({ poweredByNamefiDomain })}
          style={trafficSurgeStyles.footerLink}
        >
          Manage notification preferences
        </a>
      </Text>
    </div>
  );
}

export const DomainTrafficSurgeTemplate = (props: DomainTrafficSurgeProps) => {
  const poweredByNamefiDomain = usePoweredByNamefiDomain(
    props.poweredByNamefiDomain,
  );
  const trackingUrl = useEmailTrackingUrl();
  const trackingPixel = trackingUrl ? (
    <EmailTrackingPixel trackingUrl={trackingUrl} />
  ) : null;
  const { variant: copyVariant } = getDomainTrafficSurgeVariant(
    props.variant ?? 0,
  );
  const recipientName = props.recipientName.trim() || null;

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
  const leadgen =
    props.leadgen && props.leadgen.leads.length > 0 ? props.leadgen : null;

  return (
    <Html>
      <Head>
        <style>{trafficSurgeResponsiveCss}</style>
      </Head>
      <Preview>{emailTitle}</Preview>
      <Body className="traffic-surge-body" style={emailShellStyles.body}>
        <Container
          className="traffic-surge-shell"
          style={emailShellStyles.container}
        >
          {topDomain ? (
            <>
              <TrafficHero
                hasMultipleTrafficDomains={hasMultipleTrafficDomains}
                recipientName={recipientName}
                totalWeeklyQueries={totalWeeklyQueries}
              />
              <TopDomainsSection
                domains={sortedDomains}
                poweredByNamefiDomain={poweredByNamefiDomain}
              />
            </>
          ) : null}
          {leadgen ? (
            <LeadgenSection
              leadgen={leadgen}
              poweredByNamefiDomain={poweredByNamefiDomain}
            />
          ) : null}
          {suggestedDomains.length > 0 ? (
            <SuggestedDomainsSection
              domains={suggestedDomains}
              poweredByNamefiDomain={poweredByNamefiDomain}
            />
          ) : null}
          <TrafficEmailFooter poweredByNamefiDomain={poweredByNamefiDomain} />
          {trackingPixel}
        </Container>
      </Body>
    </Html>
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
  leadgen: {
    runId: '00000000-0000-4000-8000-000000000000',
    sourceDomain: namefiNormalizedDomainSchema.parse('brightlabs.com'),
    leads: [
      {
        leadId: '00000000-0000-4000-8000-000000000001',
        businessDomain: 'growthlabs.com',
        rationale:
          'Brand alignment with growth software and lab-style product positioning.',
        hasDraft: true,
      },
      {
        leadId: '00000000-0000-4000-8000-000000000002',
        businessDomain: 'bright.ai',
        rationale:
          'AI positioning makes the domain a natural upgrade for brand authority.',
        hasDraft: true,
      },
    ],
  },
};
