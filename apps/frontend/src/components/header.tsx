'use client';

import { CartDropdown } from '@/components/dropdowns/cart-dropdown';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { Separator } from '@/components/ui/shadcn/separator';
import { FreeMintsDropdown } from '@/components/dropdowns/free-mints-dropdown';
import { SidebarTrigger, useSidebar } from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/cn';
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

  return (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-30 flex h-16 w-full shrink-0 items-center transition-[width,height,background-color] ease-linear lg:static',
        isBlurredHeader
          ? 'border-b border-white/10 supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-2xl'
          : 'bg-transparent',
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
        <SidebarTrigger className="hidden -ml-1 md:flex" />
        <motion.div className="ml-auto flex items-center gap-3 sm:gap-4" layout>
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
