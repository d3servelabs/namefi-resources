'use client';

import { Languages } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { i18n, localeLabels, type Locale } from '@/i18n-config';

type LocaleSwitcherProps = {
  activeLocale: Locale;
  label: string;
};

export function LocaleSwitcher({ activeLocale, label }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onSelectLocale = (nextLocale: Locale) => {
    if (nextLocale === activeLocale) return;

    const segments =
      pathname?.split('/').filter((segment) => segment.length > 0) ?? [];

    if (segments.length > 0 && i18n.locales.includes(segments[0] as Locale)) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }

    const href = `/${segments.join('/')}`;
    router.push(href === '' ? '/' : href);
  };

  return (
    <div className="flex items-center gap-2 self-end rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm shadow-black/20 transition hover:border-border/40 hover:text-foreground">
      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
      <select
        value={activeLocale}
        onChange={(event) => onSelectLocale(event.target.value as Locale)}
        className="bg-transparent text-xs text-foreground outline-none border-none focus:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label={label}
      >
        {i18n.locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeLabels[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
