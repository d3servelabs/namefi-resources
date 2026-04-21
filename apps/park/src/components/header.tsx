'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useOrigin } from '@/hooks/use-origin';
import { cn } from '@namefi-astra/ui/lib/cn';

const LOGOS = {
  astra: {
    src: '/logotype.svg',
    alt: 'Namefi Astra',
    width: 132,
    height: 43,
  },
  pbn: {
    src: '/powered-by-namefi.svg',
    alt: 'Powered by Namefi',
    width: 127,
    height: 24,
  },
} as const;

export function ParkHeader({
  className,
  homeUrl = 'https://namefi.io',
  searchUrl = 'https://namefi.io',
}: {
  className?: string;
  homeUrl?: string;
  searchUrl?: string;
}) {
  const origin = useOrigin();
  const isAstra = origin?.isFirstPartyOrigin ?? false;
  const logo = isAstra ? LOGOS.astra : LOGOS.pbn;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full border-b border-white/10 bg-background/70 supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-2xl',
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href={homeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3"
          aria-label="Visit Namefi"
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className="h-6 w-auto sm:h-8"
            priority={false}
          />
        </Link>
        <Link
          href={searchUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="relative inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:border-brand-primary/70 hover:bg-brand-primary/20 hover:shadow-[0_12px_34px_color-mix(in_srgb,var(--brand-primary)_30%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80 supports-[backdrop-filter]:backdrop-blur-md"
        >
          Discover Domains
        </Link>
      </div>
    </header>
  );
}
