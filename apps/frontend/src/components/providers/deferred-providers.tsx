'use client';

import type { FC, PropsWithChildren } from 'react';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { FeedbackProvider } from './feedback';
import { FreeMintsGuidanceProvider } from './free-mints-guidance';

/**
 * Deferred providers that are not critical for first paint.
 * These are dynamically imported after the initial render to reduce
 * the module graph that needs to be compiled on first-hit routes.
 */
export const DeferredProviders: FC<PropsWithChildren> = ({ children }) => {
  return (
    <AdminFeatureFlagsProvider>
      <FreeMintsGuidanceProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </FreeMintsGuidanceProvider>
    </AdminFeatureFlagsProvider>
  );
};

export default DeferredProviders;
