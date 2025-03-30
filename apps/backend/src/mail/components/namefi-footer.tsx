import { Hr, Link, Text } from '@react-email/components';
import * as styles from '../styles';

export function NamefiFooter() {
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
      <Text style={styles.footer}>
        You can easily unsubscribe by removing the email from contact details
      </Text>
    </>
  );
}
