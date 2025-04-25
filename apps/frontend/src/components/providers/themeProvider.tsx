'use client';

import { useOrigin } from '@/components/providers/originProvider';
import { getThemeFromOrigin, setTheme } from '@/lib/origin/theme-utils';
import { type PropsWithChildren, useEffect } from 'react';

export interface ThemeProviderProps extends PropsWithChildren {}

/**
 * ThemeProvider sets the data-theme attribute on the HTML element
 * based on the current origin. The CSS variables are defined in globals.css
 * using the [data-theme="..."] selectors.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const origin = useOrigin();

  useEffect(() => {
    if (origin.isLoading) {
      return;
    }

    // Set data-theme attribute based on origin
    const themeName = getThemeFromOrigin(origin.originInfo.thirdPartyHostname);
    setTheme(themeName);
  }, [origin]);

  return <>{children}</>;
}
