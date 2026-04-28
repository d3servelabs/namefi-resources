import { Img, Section, Text } from '@react-email/components';
// biome-ignore lint/performance/noNamespaceImport: email components share styles through this module.
import * as styles from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

const NAMEFI_BRACKET_PREFIX_REGEX = /^\s*\[namefi\]\s*/i;
const NAMEFI_ONLY_TITLE_REGEX = /^\s*namefi\s*$/i;

export function NamefiHeader({
  src = 'https://storage.googleapis.com/namefi-public/namefi-logo.png',
  title,
  subtitle = 'Secure your domain portfolio with Namefi intelligence.',
}: {
  title?: string;
  src?: string;
  subtitle?: string | false;
}) {
  const cleanedTitle = title?.replace(NAMEFI_BRACKET_PREFIX_REGEX, '').trim();
  const displayTitle =
    cleanedTitle && !NAMEFI_ONLY_TITLE_REGEX.test(cleanedTitle)
      ? cleanedTitle
      : null;

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
      {subtitle !== false && (
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      )}
    </Section>
  );
}
