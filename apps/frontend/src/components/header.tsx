'use client';

import { CartDropdown } from '@/components/dropdowns/cart-dropdown';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { FreeMintsDropdown } from '@/components/dropdowns/free-mints-dropdown';
import { HeaderMissingEmailWarning } from '@/components/header-missing-email-warning';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import {
  SidebarTrigger,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useOrigin } from '@/components/providers/origin';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
} from 'react';

export type HeaderProps = HTMLAttributes<HTMLDivElement>;

export const Header: ForwardRefExoticComponent<HeaderProps> = forwardRef<
  HTMLDivElement,
  HeaderProps
>(function Header(
  { className, ...rest }: HeaderProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { isMobile } = useSidebar();
  const origin = useOrigin();
  const isBlurredHeader = origin.config.landingPage?.headerIsBlurred;

  const backgroundClass = isMobile
    ? 'bg-background/95 border-b border-border/60 shadow-sm supports-[backdrop-filter]:bg-background/70 supports-[backdrop-filter]:backdrop-blur'
    : isBlurredHeader
      ? 'border-b border-white/10 supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-2xl'
      : 'bg-transparent';

  return (
    <header
      ref={ref}
      className={cn(
        'z-30 flex h-16 w-full shrink-0 items-center transition-[width,height,background-color] ease-linear',
        isMobile
          ? 'fixed inset-x-0 top-[var(--announcement-strip-height,0px)]'
          : 'sticky top-0 lg:static',
        backgroundClass,
        isMobile ? 'px-3' : 'px-6',
        className,
      )}
      {...rest}
    >
      {isMobile && <SidebarTrigger />}
      {isMobile && (
        // Keep the mobile topbar branded as Namefi; origin-specific animated
        // branding lives in the opened sidebar.
        <Link
          href="/"
          aria-label="Namefi"
          className="ms-2 inline-flex h-6 w-[66px] shrink-0 items-center"
        >
          <Image
            src="/logotype.svg"
            alt="Namefi"
            width={66}
            height={22}
            className="h-auto w-full"
            priority
            unoptimized
          />
        </Link>
      )}
      <motion.div
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4"
        layout
        layoutRoot
      >
        <motion.div className="ms-auto flex items-center gap-2 sm:gap-4" layout>
          <div className="hidden sm:block">
            <HeaderMissingEmailWarning />
          </div>
          <LanguageSelector
            source="header"
            showLabelBelowSm={isMobile}
            className="inline-flex"
          />
          {isMobile && (
            <div className="hidden sm:block">
              <NotificationsBell variant="topbar" />
            </div>
          )}
          <CartDropdown
            className="hidden sm:block"
            disableBackdropBlur={origin.config.landingPage?.headerIsBlurred}
          />
          <FreeMintsDropdown
            className="hidden sm:inline-flex"
            disableBackdropBlur={origin.config.landingPage?.headerIsBlurred}
          />
          <motion.div className="hidden sm:block" layout>
            <UserDropdown
              disableBackdropBlur={origin.config.landingPage?.headerIsBlurred}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </header>
  );
});

Header.displayName = 'Header';
