'use client';

import dynamic from 'next/dynamic';
import type { PropsWithChildren } from 'react';

// The bprogress navigation bar is loaded lazily and client-only so its runtime
// ships as a separate, non-critical chunk instead of being bundled into the
// initial provider chunk that the (mostly static) article route downloads. The
// bar renders no children, so `children` pass straight through and keep their
// server-rendered first paint intact.
const NavigationProgressBar = dynamic(
  () =>
    import('./navigation-progress-bar').then((m) => m.NavigationProgressBar),
  { ssr: false },
);

export const ProgressProvider = ({ children }: PropsWithChildren) => {
  return (
    <>
      <NavigationProgressBar />
      {children}
    </>
  );
};
