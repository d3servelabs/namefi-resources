// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Button, Text } from '@react-email/components';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { Card } from '../components/card';
import { Code } from '../components/code';
import * as styles from '../styles';
import { getDomainTrafficSurgeVariant } from '../campaigns/domain-traffic-surge-variants';

export type DomainTrafficSurgeProps = {
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  variant?: number;
  baselineThreshold: number;
  domains: Array<{
    domain: NamefiNormalizedDomain;
    weeklyQueries: number;
  }>;
};

const tableStyles = {
  table: {
    ...styles.text,
    borderCollapse: 'collapse' as const,
    width: '100%',
    margin: '16px 0',
  },
  headerCell: {
    border: '1px solid #D9D9D9',
    padding: '8px',
    textAlign: 'left' as const,
    fontWeight: 600,
    backgroundColor: '#f8fafc',
  },
  cell: {
    border: '1px solid #D9D9D9',
    padding: '8px',
    textAlign: 'left' as const,
    verticalAlign: 'top' as const,
  },
  mutedText: {
    color: '#6b7280',
    fontSize: '13px',
  },
};

function formatCompactCount(value: number) {
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted.replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted.replace(/\.0$/, '')}k`;
  }
  return value.toLocaleString();
}

function getInterestLabel(value: number, baseline: number) {
  if (value >= baseline * 3) return 'Surging';
  if (value >= baseline * 2) return 'Strong';
  return 'High';
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

  return (
    <NamefiEmailContainer title={copyVariant.title}>
      <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
        Hi {safeRecipientName},
      </Text>
      <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
        {copyVariant.intro}
      </Text>
      <Card variant="info">
        <Text style={{ ...styles.paragraph, margin: 0 }}>
          {copyVariant.card}
        </Text>
      </Card>
      <Text style={{ ...styles.paragraph, marginBottom: '8px' }}>
        Here are the domains that stood out this week:
      </Text>
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th style={tableStyles.headerCell}>Domain</th>
            <th style={tableStyles.headerCell}>Interest this week</th>
          </tr>
        </thead>
        <tbody>
          {sortedDomains.map((item) => {
            const label = getInterestLabel(
              item.weeklyQueries,
              props.baselineThreshold,
            );
            const detail = formatCompactCount(item.weeklyQueries);

            return (
              <tr key={item.domain}>
                <td style={tableStyles.cell}>
                  <Code>{item.domain}</Code>
                </td>
                <td style={tableStyles.cell}>
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={tableStyles.mutedText}>~{detail} this week</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Text style={{ ...styles.paragraph, marginTop: '8px' }}>
        Based on activity we see on your Namefi-managed domains.
      </Text>
      <Button
        style={styles.button}
        href={NamefiEmailLinks.domains({ poweredByNamefiDomain })}
      >
        {copyVariant.cta}
      </Button>
      <Text style={{ ...styles.paragraph, marginTop: '12px' }}>
        {copyVariant.footer}
      </Text>
    </NamefiEmailContainer>
  );
};

export const domainTrafficSurgePreviewBase: DomainTrafficSurgeProps = {
  recipientName: 'Jordan',
  recipientEmail: 'jordan@example.com',
  variant: 0,
  poweredByNamefiDomain: null,
  baselineThreshold: 1000,
  domains: [
    {
      domain: namefiNormalizedDomainSchema.parse('brightlabs.com'),
      weeklyQueries: 4820,
    },
    {
      domain: namefiNormalizedDomainSchema.parse('brightlabs.io'),
      weeklyQueries: 2380,
    },
  ],
};
