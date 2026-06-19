'use client';

import { CartDropdown } from '@/components/dropdowns/cart-dropdown';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { FreeMintsDropdown } from '@/components/dropdowns/free-mints-dropdown';
import { HeaderMissingEmailWarning } from '@/components/header-missing-email-warning';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import {
  SidebarTrigger,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useOrigin } from '@/components/providers/origin';
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
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
      )}
      <motion.div className="flex w-full items-center gap-4" layout layoutRoot>
        <motion.div className="ms-auto flex items-center gap-3 sm:gap-4" layout>
          <HeaderMissingEmailWarning />
          <LanguageSelector source="header" className="inline-flex" />
          {isMobile && <NotificationsBell variant="topbar" />}
          <CartDropdown
            disableBackdropBlur={origin.config.landingPage?.headerIsBlurred}
          />
          <FreeMintsDropdown
            disableBackdropBlur={origin.config.landingPage?.headerIsBlurred}
          />
          <motion.div layout>
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
