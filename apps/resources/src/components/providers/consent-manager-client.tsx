'use client';

import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import { ClientSideOptionsProvider } from '@c15t/nextjs/client';
import { useConsentManager } from '@c15t/nextjs';
import { gtag } from '@c15t/scripts/google-tag';

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.GA_MEASUREMENT_ID ??
  '';

export function ConsentManagerClient({ children }: PropsWithChildren) {
  const { gdprTypes, hasConsented, selectedConsents, setSelectedConsent } =
    useConsentManager();
  const hasSeededDefaultRef = useRef(false);
  const scripts = useMemo(() => {
    if (!GA_MEASUREMENT_ID) return [];
    return [
      gtag({
        id: GA_MEASUREMENT_ID,
        category: 'measurement',
      }),
    ];
  }, []);

  useEffect(() => {
    if (hasSeededDefaultRef.current) return;
    if (hasConsented()) return;
    if (!gdprTypes.includes('measurement')) return;
    hasSeededDefaultRef.current = true;
    if (!selectedConsents.measurement) {
      setSelectedConsent('measurement', true);
    }
  }, [
    gdprTypes,
    hasConsented,
    selectedConsents.measurement,
    setSelectedConsent,
  ]);

  return (
    <ClientSideOptionsProvider scripts={scripts}>
      {children}
    </ClientSideOptionsProvider>
  );
}
