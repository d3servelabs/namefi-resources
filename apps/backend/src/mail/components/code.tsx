import { Text } from '@react-email/components';
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';
import * as styles from '../styles';

export function Code(props: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Text className={props.className} style={styles.code}>
      {props.children}
    </Text>
  );
}
