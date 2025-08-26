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
        We'll be here to help you with any step along the way. you can contact
        us at{' '}
        <Link style={styles.anchor} href="mailto:support@namefi.io">
          support@namefi.io
        </Link>
        .
      </Text>
      <Text style={styles.paragraph}>— The D3Serve team</Text>
      <Hr style={styles.hr} />
      <Link
        style={styles.anchor}
        href={NamefiEmailLinks.emailSubscription({ poweredByNamefiDomain })}
      >
        Click here to unsubscribe or manage your email preferences
      </Link>
    </>
  );
}
