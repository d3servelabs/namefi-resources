'use client';

import { type PropsWithChildren, useEffect, useRef } from 'react';
import { useConsentManager } from '@c15t/nextjs';

export function ConsentManagerClient({ children }: PropsWithChildren) {
  const {
    consentCategories,
    hasConsented,
    selectedConsents,
    setSelectedConsent,
  } = useConsentManager();
  const hasSeededDefaultRef = useRef(false);

  useEffect(() => {
    if (hasSeededDefaultRef.current) return;
    if (hasConsented()) return;
    if (!consentCategories.includes('measurement')) return;
    hasSeededDefaultRef.current = true;
    if (!selectedConsents.measurement) {
      setSelectedConsent('measurement', true);
    }
  }, [
    consentCategories,
    hasConsented,
    selectedConsents.measurement,
    setSelectedConsent,
  ]);

  return children;
}
