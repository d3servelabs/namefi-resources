'use client';

import { CartDropdown } from '@/components/dropdowns/cart-dropdown';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { Separator } from '@/components/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
import { useOrigin } from '@/providers/originProvider';
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

  return (
    <header
      ref={ref}
      className={cn(
        'sticky lg:static top-0 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear',
        origin.config.landingPage?.headerIsBlurred &&
          'backdrop-blur-2xl bg-background/20',
        isMobile && 'px-2',
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
      <div
        className={cn(
          'w-full items-center gap-4 flex px-4',
          isMobile ? 'justify-end' : 'justify-between',
        )}
      >
        <SidebarTrigger className="hidden md:flex -ml-1" />
        <div className="flex items-center gap-4">
          <CartDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
