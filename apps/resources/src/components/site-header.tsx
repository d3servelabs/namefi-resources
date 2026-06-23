'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';
import { LocaleSwitcher } from './locale-switcher';
import { SearchBar } from './search-bar';
import { SidebarTrigger } from '@namefi-astra/ui/components/shadcn/sidebar';

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const { switcher } = dictionary;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger className="shrink-0 text-muted-foreground" />

          <Link
            href={`/${locale}`}
            className="shrink-0 transition hover:opacity-80"
            aria-label="Namefi"
          >
            <Image
              src="/r/logotype.svg"
              alt="Namefi"
              width={132}
              height={43}
              priority
              className="h-7 w-auto sm:h-8"
            />
          </Link>

          {/* Primary element: grows to fill the row, capped so it stays tidy on
              wide screens. Hidden here on mobile, where it gets its own row below. */}
          <SearchBar
            locale={locale}
            dictionary={dictionary}
            className="hidden min-w-0 max-w-2xl flex-1 sm:block"
          />

          <div className="ms-auto flex shrink-0 items-center gap-2 sm:ms-0">
            <LocaleSwitcher activeLocale={locale} label={switcher.label} />
          </div>
        </div>

        {/* Mobile: search owns a full-width row so it stays the primary action. */}
        <SearchBar
          locale={locale}
          dictionary={dictionary}
          className="mt-3 w-full sm:hidden"
        />
      </div>
    </header>
  );
}
