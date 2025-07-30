import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  type PreviewProps,
  Section,
  Tailwind,
} from '@react-email/components';
import * as styles from '../styles';
import { NamefiFooter } from './namefi-footer';
import { NamefiHeader } from './namefi-header';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';
import { isNotNil } from 'ramda';

export function NamefiEmailContainer({
  title,
  children,
  footer = 'default',
  header = 'default',
}: {
  title: PreviewProps['children'];
  children: React.ReactNode;
  footer?: React.ReactNode | 'default' | undefined | null | false;
  header?: React.ReactNode | 'default' | undefined | null | false;
}) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>{title}</Preview>
        <Body style={styles.main}>
          <Container style={styles.container}>
            <Section style={styles.box}>
              {isNotNil(header) &&
                (header === 'default' ? <NamefiHeader /> : header)}
              {children}
              {isNotNil(footer) &&
                (footer === 'default' ? <NamefiFooter /> : footer)}
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
