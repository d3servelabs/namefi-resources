'use client';

import type { AppProgressBarProps } from 'next-nprogress-bar';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import type { ReactNode } from 'react';

type Props = AppProgressBarProps & { children: ReactNode };

export const ProgressProvider = ({ children, ...rest }: Readonly<Props>) => {
  return (
    <>
      <ProgressBar
        height="4px"
        color="#ffffff"
        options={{ showSpinner: false }}
        {...rest}
        shallowRouting={true}
      />
      {children}
    </>
  );
};
