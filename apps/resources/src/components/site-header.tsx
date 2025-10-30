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
  const { switcher, nav } = dictionary;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-5 md:px-10 lg:px-12">
        <div className="flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Image
              src="/r/logotype.svg"
              alt="Namefi"
              width={132}
              height={43}
              priority
              className="h-8 w-auto"
            />
            <span className="hidden text-xs uppercase tracking-[0.3em] md:inline">
              {nav.resources}
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            <Link
              href={`/${locale}/blog`}
              className="transition hover:text-foreground"
            >
              {nav.blog}
            </Link>
            <Link
              href={`/${locale}/tld`}
              className="transition hover:text-foreground"
            >
              {nav.tld}
            </Link>
            <Link
              href={`/${locale}/partners`}
              className="transition hover:text-foreground"
            >
              {nav.partners}
            </Link>
          </nav>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground md:hidden">
          <Link
            href={`/${locale}/blog`}
            className="transition hover:text-foreground"
          >
            {nav.blog}
          </Link>
          <Link
            href={`/${locale}/tld`}
            className="transition hover:text-foreground"
          >
            {nav.tld}
          </Link>
          <Link
            href={`/${locale}/partners`}
            className="transition hover:text-foreground"
          >
            {nav.partners}
          </Link>
        </nav>

        <LocaleSwitcher activeLocale={locale} label={switcher.label} />
      </div>
    </header>
  );
}
