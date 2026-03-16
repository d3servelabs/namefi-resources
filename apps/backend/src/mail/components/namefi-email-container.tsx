import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';
import * as styles from '../styles';
import { EmailTrackingPixel, useEmailTrackingUrl } from './email-tracking';
import { NamefiFooter } from './namefi-footer';
import { NamefiHeader } from './namefi-header';
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';
import { isNotNil } from 'ramda';

export function NamefiEmailContainer({
  title,
  children,
  footer = 'default',
  header = 'default',
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode | 'default' | undefined | null | false;
  header?: React.ReactNode | 'default' | undefined | null | false;
}) {
  const trackingUrl = useEmailTrackingUrl();
  const trackingPixel = trackingUrl ? (
    <EmailTrackingPixel trackingUrl={trackingUrl} />
  ) : null;
  const shouldRenderDefaultHeader = isNotNil(header) && header === 'default';
  const customHeader =
    isNotNil(header) && header !== 'default'
      ? (header as React.ReactNode)
      : null;
  return (
    <Tailwind>
      <Html>
        <Head>
          <style>
            {`
            #markdown-table table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid ${styles.astraTheme.border};
}

#markdown-table th,
#markdown-table td {
  border: 1px solid ${styles.astraTheme.border};
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  color: ${styles.astraTheme.textPrimary};
}

#markdown-table th {
  background-color: ${styles.astraTheme.surfaceAlt};
  color: ${styles.astraTheme.textSecondary};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

#markdown-table tr:nth-child(even) {
  background-color: ${styles.astraTheme.surfaceStripe};
}

.namefi-button-row {
  width: auto;
  border-collapse: separate;
  border-spacing: 0;
  margin-left: auto;
  margin-right: auto;
}

.namefi-button-cell {
  width: auto;
  vertical-align: top;
}

.namefi-button-mobile {
  display: inline-block;
  width: auto;
}

@media only screen and (max-width: 620px) {
  .namefi-button-row,
  .namefi-button-row tbody,
  .namefi-button-row tr,
  .namefi-button-cell {
    display: block !important;
    width: 100% !important;
  }

  .namefi-button-cell {
    padding-right: 0 !important;
    padding-left: 0 !important;
    padding-bottom: 4px !important;
  }

  .namefi-button-mobile {
    display: block !important;
    width: 100% !important;
    min-width: 0 !important;
    margin-top: 4px !important;
    margin-bottom: 4px !important;
  }

  a[style*="min-width: 190px"],
  a[style*="min-width:190px"] {
    box-sizing: border-box !important;
    display: block !important;
    margin-top: 4px !important;
    margin-bottom: 4px !important;
    min-width: 0 !important;
    width: 100% !important;
  }
}
            `}
          </style>
        </Head>
        <Preview>{title}</Preview>
        <Body style={styles.main}>
          <Container style={styles.container}>
            {shouldRenderDefaultHeader && <NamefiHeader title={title} />}
            <Section style={styles.box}>
              {customHeader}
              {children}
              {isNotNil(footer) &&
                (footer === 'default' ? <NamefiFooter /> : footer)}
              {trackingPixel}
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
