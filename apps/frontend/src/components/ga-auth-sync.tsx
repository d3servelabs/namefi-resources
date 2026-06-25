'use client';

import { useEffect, useRef } from 'react';
import { useNamefiConsent } from '@/components/providers/consent/namefi-consent';
import { useAuth } from '@/hooks/use-auth';
import { config } from '@/lib/env';

export function GoogleAnalyticsAuthenticatedUserSync() {
  const { consents, isLoadingConsentInfo } = useNamefiConsent();
  const hasMeasurement = consents.measurement;
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const gaUserId =
    hasMeasurement && !isAuthLoading && isAuthenticated ? user?.id : null;
  const currentSyncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.GA_MEASUREMENT_ID) return;
    if (isLoadingConsentInfo || isAuthLoading) return;

    if (gaUserId) {
      window.gtag?.('set', { user_id: gaUserId });
      currentSyncedUserIdRef.current = gaUserId;
      return;
    }

    if (currentSyncedUserIdRef.current) {
      window.gtag?.('set', { user_id: null });
      currentSyncedUserIdRef.current = null;
    }
  }, [gaUserId, isAuthLoading, isLoadingConsentInfo]);

  return null;
}
