'use client';

import { ProgressProvider as NextProgressProvider } from '@bprogress/next/app';
import type { AppProgressProviderProps } from '@bprogress/next';

export const ProgressProvider = ({
  children,
  ...rest
}: AppProgressProviderProps) => {
  return (
    <>
      <NextProgressProvider
        {...rest}
        height="2px"
        color="var(--color-brand-primary)"
        options={{ showSpinner: false }}
        shallowRouting
        disableSameURL
      />
      {children}
    </>
  );
};
