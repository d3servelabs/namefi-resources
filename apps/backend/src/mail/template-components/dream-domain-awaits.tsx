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
import * as styles from '../styles';
import { getDreamDomainAwaitsVariant } from '../campaigns/dream-domain-awaits-variants';

export type DreamDomainAwaitsProps = {
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  variant?: number;
  suggestedDomains?: NamefiNormalizedDomain[];
};

export const DreamDomainAwaitsTemplate = (props: DreamDomainAwaitsProps) => {
  const poweredByNamefiDomain = usePoweredByNamefiDomain(
    props.poweredByNamefiDomain,
  );
  const safeRecipientName = props.recipientName?.trim()
    ? props.recipientName
    : 'there';
  const { variant: copyVariant } = getDreamDomainAwaitsVariant(
    props.variant ?? 0,
  );
  const suggestedDomains = props.suggestedDomains ?? [];
  const hasSuggestions = suggestedDomains.length > 0;
  const domainTextStyle = {
    ...styles.text,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '14px',
  };
  const suggestionsTableStyle = {
    ...styles.text,
    width: '100%',
    borderCollapse: 'collapse' as const,
  };
  const addToCartLinkStyle = {
    backgroundColor: '#14b8a6',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 10px',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <NamefiEmailContainer title={copyVariant.title}>
      <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
        Hi {safeRecipientName},
      </Text>
      <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
        {copyVariant.intro}
      </Text>
      {hasSuggestions ? (
        <>
          <Text style={{ ...styles.paragraph, marginBottom: '12px' }}>
            Based on the domains you already have, here are a few available
            ideas in the same family:
          </Text>
          <Card variant="success">
            <table style={suggestionsTableStyle}>
              <tbody>
                {suggestedDomains.map((domain) => (
                  <tr key={domain}>
                    <td style={{ padding: '6px 0' }}>
                      <span style={domainTextStyle}>{domain}</span>
                    </td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>
                      <a
                        href={NamefiEmailLinks.addToCartFromUrl({
                          domain,
                          poweredByNamefiDomain,
                        })}
                        style={addToCartLinkStyle}
                      >
                        Add to Cart
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}
      <Card variant="info">
        <Text style={{ ...styles.paragraph, marginTop: 0 }}>
          {copyVariant.tipHeader}
        </Text>
        {copyVariant.tips.map((tip, index) => (
          <Text key={tip} style={{ ...styles.paragraph, margin: 0 }}>
            {index + 1}) {tip}
          </Text>
        ))}
      </Card>
      <Button
        style={styles.button}
        href={NamefiEmailLinks.home({ poweredByNamefiDomain })}
      >
        {copyVariant.cta}
      </Button>
      <Text style={{ ...styles.paragraph, marginTop: '12px' }}>
        {copyVariant.footer}
      </Text>
    </NamefiEmailContainer>
  );
};

export const dreamDomainAwaitsPreviewBase: DreamDomainAwaitsProps = {
  recipientName: 'Jordan',
  recipientEmail: 'jordan@example.com',
  variant: 0,
  poweredByNamefiDomain: null,
  suggestedDomains: [
    namefiNormalizedDomainSchema.parse('brightlabs.com'),
    namefiNormalizedDomainSchema.parse('brightlabs.io'),
    namefiNormalizedDomainSchema.parse('brightlabs.xyz'),
  ],
};
