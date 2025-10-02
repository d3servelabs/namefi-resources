'use client';

import { cn } from '@/lib/cn';
import { useCookieConsent } from '@/components/providers/cookie-consent';
import Image from 'next/image';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
} from 'react';
import { Mail } from 'lucide-react';
import { useIsClient } from 'usehooks-ts';

export type FooterProps = HTMLAttributes<HTMLDivElement>;

export const Footer: ForwardRefExoticComponent<FooterProps> = forwardRef<
  HTMLDivElement,
  FooterProps
>(function Footer(
  { className, children, ...rest }: FooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { openConsent } = useCookieConsent();
  const isClient = useIsClient();

  return (
    <footer
      ref={ref}
      className={cn('w-full bg-background py-8 mt-auto', className)}
      {...rest}
    >
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="flex items-center space-x-2">
          <Image
            src="/powered-by-namefi.svg"
            alt="Powered by Namefi"
            width={127.38}
            height={24}
          />
          <span className="text-secondary-foreground text-sm ml-2">
            © D3SERVE LABS, Inc.
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href={isClient ? '?newsletter=true' : '/newsletter'}
            className="text-gray-300 hover:text-secondary-foreground text-sm flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            Subscribe To Newsletter
          </Link>
          <button
            type="button"
            className="text-gray-300 hover:text-secondary-foreground text-sm bg-transparent border-0 p-0 cursor-pointer"
            aria-label="Open cookie settings dialog"
            onClick={openConsent}
          >
            Cookie Settings
          </button>

          <Link
            href="https://namefi.io/tos"
            className="text-gray-300 hover:text-secondary-foreground text-sm"
          >
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
