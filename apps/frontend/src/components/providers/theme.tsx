'use client';

import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children, ...rest }: ThemeProviderProps) {
  return <NextThemesProvider {...rest}>{children}</NextThemesProvider>;
}
