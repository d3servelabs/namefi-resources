'use client';

import { type PropsWithChildren, useEffect, useRef } from 'react';
import { useConsentManager } from '@c15t/nextjs';

export function ConsentManagerClient({ children }: PropsWithChildren) {
  const { gdprTypes, hasConsented, selectedConsents, setSelectedConsent } =
    useConsentManager();
  const hasSeededDefaultRef = useRef(false);

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

  return children;
}
