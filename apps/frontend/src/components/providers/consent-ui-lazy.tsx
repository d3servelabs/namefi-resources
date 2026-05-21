'use client';

import { ConsentBanner, ConsentDialog } from '@c15t/nextjs';

/**
 * Client-only consent UI components.
 *
 * This module is intentionally kept separate so it can be dynamically
 * imported later if needed. For now it remains a small, direct import.
 */
export function ConsentUIComponents() {
  return (
    <>
      <ConsentBanner
        layout={['customize', ['reject', 'accept']]}
        primaryButton="accept"
      />
      <ConsentDialog />
    </>
  );
}

export default ConsentUIComponents;
