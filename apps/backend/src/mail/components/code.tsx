import { Text } from '@react-email/components';
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';

export function Code(props: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Text
      className={`outline outline-1 px-[0.5px] mx-1 py-[0.5px] inline font-mono rounded-sm text-green-700 text-center ${props.className ?? ''}`}
    >
      {props.children}
    </Text>
  );
}
