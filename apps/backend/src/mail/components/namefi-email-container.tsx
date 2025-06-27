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
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import type React from 'react';
import * as styles from '../styles';
import { NamefiFooter } from './namefi-footer';
import { NamefiHeader } from './namefi-header';

export function NamefiEmailContainer({
  title,
  children,
}: {
  title: PreviewProps['children'];
  children: React.ReactNode;
}) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>{title}</Preview>
        <Body style={styles.main}>
          <Container style={styles.container}>
            <Section style={styles.box}>
              <NamefiHeader />
              {children}
              <NamefiFooter />
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
