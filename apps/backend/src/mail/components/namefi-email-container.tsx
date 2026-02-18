import {
  Body,
  Container,
  Head,
  Html,
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

const threadSafePreviewStyle = {
  display: 'none',
  maxHeight: '0px',
  maxWidth: '0px',
  overflow: 'hidden',
  opacity: 0,
  color: 'transparent',
  lineHeight: '1px',
  fontSize: '1px',
  msoHide: 'all',
} as React.CSSProperties & { msoHide: string };

export function NamefiEmailContainer({
  title,
  children,
  footer = 'default',
  header = 'default',
  previewText = title,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode | 'default' | undefined | null | false;
  header?: React.ReactNode | 'default' | undefined | null | false;
  previewText?: string | false;
}) {
  const trackingUrl = useEmailTrackingUrl();
  const trackingPixel = trackingUrl ? (
    <EmailTrackingPixel trackingUrl={trackingUrl} />
  ) : null;
  return (
    <Tailwind>
      <Html>
        <Head>
          <style>
            {`
            #markdown-table table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

#markdown-table th,
#markdown-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

#markdown-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

#markdown-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

#markdown-table tr:hover {
  background-color: #e9e9e9;
}
            `}
          </style>
        </Head>
        <Body style={styles.main}>
          {previewText !== false ? (
            <div style={threadSafePreviewStyle}>{previewText}</div>
          ) : null}
          <Container style={styles.container}>
            <Section style={styles.box}>
              {isNotNil(header) &&
                (header === 'default' ? (
                  <NamefiHeader title={title} />
                ) : (
                  header
                ))}
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
