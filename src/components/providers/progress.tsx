'use client';

import type { AppProgressProviderProps } from '@bprogress/next';
import { ProgressProvider as NextProgressProvider } from '@bprogress/next/app';

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
