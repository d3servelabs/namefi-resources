'use client';

import { CookieBanner, ConsentManagerDialog } from '@c15t/nextjs';

/**
 * Client-only consent UI components.
 *
 * This module is intentionally kept separate so it can be dynamically
 * imported later if needed. For now it remains a small, direct import.
 */
export function ConsentUIComponents() {
  return (
    <>
      <CookieBanner />
      <ConsentManagerDialog />
    </>
  );
}

export default ConsentUIComponents;
