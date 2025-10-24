'use client';

import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useOrigin } from './origin';
import { resolveParkTheme } from '@/lib/theme';

export function ThemeProvider({ children, ...rest }: ThemeProviderProps) {
  const origin = useOrigin();
  const theme = resolveParkTheme(origin);

  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme={theme}
      forcedTheme={theme}
      enableSystem={false}
      disableTransitionOnChange={true}
      {...rest}
    >
      {children}
    </NextThemesProvider>
  );
}
