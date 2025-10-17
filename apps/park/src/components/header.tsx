'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useOrigin } from '@/hooks/use-origin';
import { cn } from '@/lib/cn';

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
  host,
}: {
  className?: string;
  host?: string;
}) {
  const origin = useOrigin();
  const isAstra = origin?.isFirstPartyOrigin ?? false;
  const logo = isAstra ? LOGOS.astra : LOGOS.pbn;

  return (
    <header
      className={cn(
        'sticky top-0 z-20 w-full border-b border-border/40 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/40',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="https://namefi.io"
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
        <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
          {host ? (
            <>
              <span className="rounded-full border border-border/60 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em]">
                Parked Domain
              </span>
              <span className="font-medium text-foreground/80">{host}</span>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
