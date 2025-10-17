'use client';

import { useCallback, useState } from 'react';

export type ConsentState = 'accepted' | 'declined' | 'unknown';

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>('unknown');

  const openConsent = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookie-consent:open'));
    }
  }, []);

  const accept = useCallback(() => setConsent('accepted'), []);
  const decline = useCallback(() => setConsent('declined'), []);

  return {
    consent,
    openConsent,
    accept,
    decline,
  };
}
