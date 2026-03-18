import { Img, Section, Text } from '@react-email/components';
import * as styles from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

export function NamefiHeader({
  src = 'https://storage.googleapis.com/namefi-public/namefi-logo.png',
  title,
}: {
  title?: string;
  src?: string;
}) {
  const cleanedTitle = title?.replace(/^\s*\[namefi\]\s*/i, '').trim();
  const displayTitle =
    cleanedTitle && !/^\s*namefi\s*$/i.test(cleanedTitle) ? cleanedTitle : null;

  return (
    <Section className="namefi-header-shell" style={styles.headerShell}>
      <Img
        src={src}
        width="92"
        height="92"
        alt="Namefi"
        style={styles.headerLogo}
      />
      {displayTitle && <Text style={styles.headerTitle}>{displayTitle}</Text>}
      <Text style={styles.headerSubtitle}>
        Secure your domain portfolio with Namefi intelligence.
      </Text>
    </Section>
  );
}
