'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CartDropdown } from '@/components/dropdowns/CartDropdown';
import { UserDropdown } from '@/components/dropdowns/UserDropdown';
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
  const { isMobile, open } = useSidebar();

  return (
    <header
      ref={ref}
      className={cn(
        'flex h-14 items-center gap-4 border-b backdrop-blur-xl bg-muted/40 px-4 lg:h-[60px]',
        className,
      )}
      {...rest}
    >
      {isMobile && <SidebarTrigger />}
      {isMobile && <Separator orientation="vertical" className="h-4" />}
      <div className="w-full items-center justify-between gap-4 flex">
        <div>
          <Breadcrumbs className="hidden md:flex" />
        </div>
        <div className="flex items-center gap-4">
          <CartDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
