import { Hr, Img, Text } from '@react-email/components';
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
  return (
    <>
      <div className="flex items-center gap-2">
        <Img src={src} width="49" height="49" alt="Namefi" />
        {!!title && <h1 style={styles.text}>Namefi - {title}</h1>}
      </div>
      <Hr style={styles.hr} />
    </>
  );
}
