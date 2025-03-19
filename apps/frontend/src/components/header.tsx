'use client';

import { UserDropdown } from '@/components/dropdowns/UserDropdown';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/shadcn/breadcrumb';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import { SidebarTrigger } from '@/components/ui/shadcn/sidebar';
import { cn } from '@/lib/utils';
import { ShoppingCartIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';
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
  const [domain] = useQueryState('domain');

  return (
    <header
      ref={ref}
      className={cn(
        'flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6',
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 mr-2" />
        {domain && <h1 className="text-2xl font-bold">{domain}</h1>}
      </div>
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="w-full items-center justify-between gap-4 flex">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {/*<BreadcrumbSeparator className="hidden md:block" />*/}
            {/*<BreadcrumbItem>*/}
            {/*  <BreadcrumbPage>Data Fetching</BreadcrumbPage>*/}
            {/*</BreadcrumbItem>*/}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ShoppingCartIcon className="h-5 w-5" />
          </Button>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
