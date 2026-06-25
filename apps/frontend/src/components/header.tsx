'use client';

import { CartDropdown } from '@/components/dropdowns/cart-dropdown';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { FreeMintsDropdown } from '@/components/dropdowns/free-mints-dropdown';
import { HeaderMissingEmailWarning } from '@/components/header-missing-email-warning';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useOrigin } from '@/components/providers/origin';
import { MOBILE_NAV_TOGGLE_ID } from '@/components/sidebars/mobile-nav-toggle-id';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
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
  const tNav = useTranslations('nav');
  const isBlurredHeader = origin.config.landingPage?.headerIsBlurred;

  return (
    <header
      ref={ref}
      className={cn(
        'z-30 flex h-16 w-full shrink-0 items-center px-3 transition-[width,height,background-color] ease-linear md:px-6',
        // Position + background are expressed as CSS breakpoints (mobile = the
        // `< md` 768px band) instead of the client `isMobile` flag, so the mobile
        // top bar — including the hamburger and brand below — is part of the
        // server-rendered HTML and paints with first paint, NOT after hydration.
        'max-md:fixed max-md:inset-x-0 max-md:top-[var(--announcement-strip-height,0px)] md:sticky md:top-0 lg:static',
        'max-md:border-b max-md:border-border/60 max-md:bg-background/95 max-md:shadow-sm max-md:supports-[backdrop-filter]:bg-background/70 max-md:supports-[backdrop-filter]:backdrop-blur',
        isBlurredHeader
          ? 'md:border-b md:border-white/10 md:bg-transparent md:supports-[backdrop-filter]:bg-background/40 md:supports-[backdrop-filter]:backdrop-blur-2xl'
          : 'md:bg-transparent',
        className,
      )}
      {...rest}
    >
      {/* Hamburger — a <label> for the mobile drawer's toggle checkbox, so it
          opens the drawer with NO JavaScript (works from first-paint HTML,
          before hydration). SSR-rendered, mobile-only via CSS. */}
      <label
        htmlFor={MOBILE_NAV_TOGGLE_ID}
        aria-label={tNav('mobileDrawer.open')}
        data-testid="nav.mobile-drawer.trigger"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-foreground/80 hover:bg-accent hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </label>
      {/* Mobile brand — SSR-rendered, hidden on desktop (desktop branding lives
          in the sidebar). Was gated behind the client `isMobile` flag, which
          kept it out of the first-paint HTML until hydration. */}
      <Link
        href="/"
        aria-label="Namefi"
        className="ms-2 inline-flex h-6 w-[66px] shrink-0 items-center md:hidden"
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
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <div className="ms-auto flex items-center gap-2 sm:gap-4">
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
          <div className="hidden sm:block">
            <UserDropdown
              disableBackdropBlur={origin.config.landingPage?.headerIsBlurred}
            />
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
