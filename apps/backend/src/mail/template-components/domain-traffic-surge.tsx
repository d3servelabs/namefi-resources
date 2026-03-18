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
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
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
  suggestedDomains?: NamefiNormalizedDomain[];
};

const tableStyles = {
  table: {
    ...styles.table,
  },
  headerCell: {
    ...styles.tableHeaderCell,
  },
  cell: {
    ...styles.tableCell,
  },
  mutedText: {
    ...styles.mutedText,
  },
  domainText: {
    ...styles.monospaceText,
  },
  addToCartLink: {
    ...styles.inlineActionLink,
  },
  actionHeaderCell: {
    ...styles.tableHeaderCellNumeric,
  },
  actionCell: {
    ...styles.tableCellNumeric,
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
  const suggestedDomains = props.suggestedDomains ?? [];

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
      <EmailTable>
        <thead>
          <EmailTableRow>
            <EmailTableHeaderCell style={tableStyles.headerCell}>
              Domain
            </EmailTableHeaderCell>
            <EmailTableHeaderCell style={tableStyles.headerCell}>
              Interest this week
            </EmailTableHeaderCell>
          </EmailTableRow>
        </thead>
        <tbody>
          {sortedDomains.map((item) => {
            const label = getInterestLabel(
              item.weeklyQueries,
              props.baselineThreshold,
            );
            const detail = formatCompactCount(item.weeklyQueries);

            return (
              <EmailTableRow key={item.domain}>
                <EmailTableCell label="Domain" style={tableStyles.cell}>
                  <span style={tableStyles.domainText}>{item.domain}</span>
                </EmailTableCell>
                <EmailTableCell
                  label="Interest this week"
                  style={tableStyles.cell}
                >
                  <div style={{ fontWeight: 600 }}>{label}</div>
                  <div style={tableStyles.mutedText}>~{detail} this week</div>
                </EmailTableCell>
              </EmailTableRow>
            );
          })}
        </tbody>
      </EmailTable>
      {suggestedDomains.length > 0 ? (
        <>
          <Text style={{ ...styles.paragraph, marginTop: '8px' }}>
            AI also found similar available names you may want to secure:
          </Text>
          <EmailTable
            wrapStyle={{ marginTop: '8px' }}
            tableStyle={{ ...tableStyles.table, marginTop: '0' }}
          >
            <thead>
              <EmailTableRow>
                <EmailTableHeaderCell style={tableStyles.headerCell}>
                  Suggested domain
                </EmailTableHeaderCell>
                <EmailTableHeaderCell
                  numeric
                  style={tableStyles.actionHeaderCell}
                >
                  Action
                </EmailTableHeaderCell>
              </EmailTableRow>
            </thead>
            <tbody>
              {suggestedDomains.map((domain) => (
                <EmailTableRow key={domain}>
                  <EmailTableCell
                    label="Suggested domain"
                    style={tableStyles.cell}
                  >
                    <span style={tableStyles.domainText}>{domain}</span>
                  </EmailTableCell>
                  <EmailTableCell
                    label="Action"
                    numeric
                    style={tableStyles.actionCell}
                  >
                    <a
                      href={NamefiEmailLinks.addToCartFromUrl({
                        domain,
                        poweredByNamefiDomain,
                      })}
                      style={tableStyles.addToCartLink}
                    >
                      Add to Cart
                    </a>
                  </EmailTableCell>
                </EmailTableRow>
              ))}
            </tbody>
          </EmailTable>
        </>
      ) : null}
      <Text style={{ ...styles.paragraph, marginTop: '8px' }}>
        Based on activity we see on your Namefi-managed domains.
      </Text>
      <Button
        className="namefi-button-mobile"
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
  suggestedDomains: [
    namefiNormalizedDomainSchema.parse('brightlabshq.com'),
    namefiNormalizedDomainSchema.parse('brightlabsteam.com'),
  ],
};
