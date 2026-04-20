'use client';

import { useIsClient } from '@suspensive/react';
import { type FC, useEffect } from 'react';

declare global {
  var namefi_tlds: string[];
}

export const UnofficialTldsInjector: FC = () => {
  const isClient = useIsClient();
  useEffect(() => {
    if (isClient) {
      globalThis.namefi_tlds = ['namefi', 'test'];
    }
  }, [isClient]);

  return false;
};
