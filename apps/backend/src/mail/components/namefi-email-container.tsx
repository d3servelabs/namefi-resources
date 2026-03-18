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
#markdown-table {
  margin: 16px 0;
}

#markdown-table table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  border: 1px solid ${styles.astraTheme.border};
}

#markdown-table th,
#markdown-table td {
  border: 1px solid ${styles.astraTheme.border};
  box-sizing: border-box;
  padding: 10px 12px;
  text-align: left;
  font-size: 14px;
  color: ${styles.astraTheme.textPrimary};
  overflow-wrap: anywhere;
  word-break: break-word;
}

#markdown-table th[align='right'],
#markdown-table td[align='right'],
#markdown-table td.namefi-data-table-cell-numeric {
  text-align: right;
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

.namefi-shell {
  width: 100%;
}

.namefi-data-table {
  width: 100%;
}

.namefi-data-table-mobile-label {
  display: none;
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
  .namefi-body {
    box-sizing: border-box !important;
    padding: 16px 8px 24px !important;
    width: auto !important;
  }

  .namefi-shell {
    border-radius: 14px !important;
  }

  .namefi-content {
    padding-left: 18px !important;
    padding-right: 18px !important;
  }

  .namefi-header-shell {
    padding: 24px 18px 18px !important;
  }

  .namefi-table-wrap {
    border: none !important;
    border-radius: 14px !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    overflow: visible !important;
  }

  .namefi-data-table,
  .namefi-data-table tbody,
  #markdown-table table,
  #markdown-table tbody {
    background-color: transparent !important;
    border: none !important;
    display: block !important;
    margin: 0 !important;
    table-layout: fixed !important;
    width: 100% !important;
  }

  .namefi-data-table thead,
  #markdown-table thead {
    display: none !important;
  }

  .namefi-data-table-row,
  #markdown-table tr {
    background-color: ${styles.astraTheme.surface} !important;
    border: none !important;
    border-radius: 12px !important;
    display: block !important;
    margin-bottom: 12px !important;
    overflow: hidden !important;
  }

  .namefi-data-table-cell,
  #markdown-table td {
    background-color: transparent !important;
    border-bottom: none !important;
    border-left: none !important;
    border-right: none !important;
    border-top: 1px solid ${styles.astraTheme.border} !important;
    box-sizing: border-box !important;
    display: block !important;
    overflow-wrap: anywhere !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
    text-align: left !important;
    width: 100% !important;
    word-break: break-word !important;
  }

  .namefi-data-table-cell:first-child,
  #markdown-table td:first-child {
    border-top: none !important;
  }

  .namefi-data-table-cell-hidden-mobile {
    display: none !important;
  }

  .namefi-data-table-mobile-label {
    color: ${styles.astraTheme.textSubtle} !important;
    display: block !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    letter-spacing: 0.04em !important;
    line-height: 18px !important;
    margin-bottom: 6px !important;
    text-transform: uppercase !important;
  }

  .namefi-key-value-table,
  .namefi-key-value-table tbody {
    display: block !important;
    width: 100% !important;
  }

  .namefi-key-value-row {
    background-color: ${styles.astraTheme.surface} !important;
    border: none !important;
    border-radius: 12px !important;
    display: block !important;
    margin-bottom: 12px !important;
    overflow: hidden !important;
  }

  .namefi-key-value-label,
  .namefi-key-value-value {
    background-color: transparent !important;
    border-bottom: none !important;
    border-left: none !important;
    border-right: none !important;
    border-top: 1px solid ${styles.astraTheme.border} !important;
    box-sizing: border-box !important;
    display: block !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
    width: 100% !important;
  }

  .namefi-key-value-label {
    border-top: none !important;
    padding-bottom: 6px !important;
    padding-top: 12px !important;
    width: 100% !important;
  }

  .namefi-key-value-value {
    padding-bottom: 12px !important;
    padding-top: 8px !important;
  }

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
        <Body className="namefi-body" style={styles.main}>
          <Container className="namefi-shell" style={styles.container}>
            {shouldRenderDefaultHeader && <NamefiHeader title={title} />}
            <Section className="namefi-content" style={styles.box}>
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
