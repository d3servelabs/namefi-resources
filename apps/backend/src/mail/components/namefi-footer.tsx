import { Hr, Link, Text } from '@react-email/components';
import * as styles from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from './powered-by-namefi-url-context';

export function NamefiFooter() {
  const poweredByNamefiDomain = usePoweredByNamefiDomain();
  return (
    <>
      <Hr style={styles.hr} />

      <Text style={styles.paragraph}>
        More questions?{' '}
        <Link style={styles.anchor} href="mailto:support@namefi.io">
          support@namefi.io
        </Link>
      </Text>
      <Link
        style={styles.anchor}
        href={NamefiEmailLinks.emailSubscription({ poweredByNamefiDomain })}
      >
        Unsubscribe or manage your email preferences
      </Link>
    </>
  );
}
