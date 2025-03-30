import { Hr, Img } from '@react-email/components';
import * as styles from '../styles';

// TODO: Replace with a CDN or hosted image URL for production
export function NamefiHeader() {
  return (
    <>
      <Img
        src={'https://app.namefi.io/android-chrome-192x192.png'}
        width="49"
        height="49"
        alt="D3Serve"
      />
      <Hr style={styles.hr} />
    </>
  );
}
