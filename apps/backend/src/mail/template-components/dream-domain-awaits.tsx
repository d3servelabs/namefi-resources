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
            {suggestedDomains.map((domain) => (
              <Text key={domain} style={{ ...styles.paragraph, margin: 0 }}>
                - <Code>{domain}</Code>
              </Text>
            ))}
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
