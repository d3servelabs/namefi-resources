'use client';

import dynamic from 'next/dynamic';
import type { FC, PropsWithChildren } from 'react';
import { AdminFeatureFlagsProvider } from '@/components/admin/feature-flags/context';
import { AdminFeatureFlagsSheet } from '@/components/admin/feature-flags/sheet';
import { FeedbackProvider } from './feedback';
import { FreeMintsGuidanceProvider } from './free-mints-guidance';
import { OpenFeatureClientProvider } from './openfeature';

// Non-critical "reload after new deployment" watcher. Lazily loaded so its
// React Query poll, Sonner toast, and Button never enter the first-paint chunk.
const DeploymentUpdateToast = dynamic(
  () =>
    import('@/components/deployment-update-toast').then(
      (m) => m.DeploymentUpdateToast,
    ),
  { ssr: false },
);

/**
 * Deferred providers that are not critical for first paint.
 * These are dynamically imported after the initial render to reduce
 * the module graph that needs to be compiled on first-hit routes.
 */
export const DeferredProviders: FC<PropsWithChildren> = ({ children }) => {
  return (
    <AdminFeatureFlagsProvider>
      <FreeMintsGuidanceProvider>
        <FeedbackProvider>
          <OpenFeatureClientProvider>
            {children}
            <AdminFeatureFlagsSheet />
            <DeploymentUpdateToast />
          </OpenFeatureClientProvider>
        </FeedbackProvider>
      </FreeMintsGuidanceProvider>
    </AdminFeatureFlagsProvider>
  );
};

export default DeferredProviders;
