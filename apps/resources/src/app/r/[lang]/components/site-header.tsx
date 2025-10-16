import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';
import { LocaleSwitcher } from './locale-switcher';

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const { switcher } = dictionary;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-5 md:px-10 lg:px-12">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Image
            src="/logotype.svg"
            alt="Namefi"
            width={132}
            height={43}
            priority
            className="h-8 w-auto"
          />
          <span className="hidden text-xs uppercase tracking-[0.3em] md:inline">
            Blog
          </span>
        </Link>

        <LocaleSwitcher activeLocale={locale} label={switcher.label} />
      </div>
    </header>
  );
}
