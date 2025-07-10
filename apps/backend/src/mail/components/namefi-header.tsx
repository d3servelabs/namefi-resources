import { Hr, Img } from '@react-email/components';
import * as styles from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

export function NamefiHeader({
  src = 'https://storage.googleapis.com/namefi-public/namefi-logo.png',
}: {
  src?: string;
}) {
  return (
    <>
      <Img src={src} width="49" height="49" alt="Namefi" />
      <Hr style={styles.hr} />
    </>
  );
}
