'use client';

import { CartDropdown } from '@/components/dropdowns/cart-dropdown';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { Separator } from '@/components/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
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

  return (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-50 flex h-14 items-center gap-4 backdrop-blur-xl bg-muted/40 px-4 lg:static lg:h-[60px]',
        className,
      )}
      {...rest}
    >
      {isMobile && <SidebarTrigger />}
      {isMobile && <Separator orientation="vertical" className="h-4" />}
      <div
        className={cn(
          'w-full items-center gap-4 flex',
          isMobile ? 'justify-end' : 'justify-between',
        )}
      >
        <SidebarTrigger className="hidden md:flex" />
        <div className="flex items-center gap-4">
          <CartDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
