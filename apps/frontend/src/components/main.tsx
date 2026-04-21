'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';

export const Main = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const triggerLeft =
    state === 'collapsed'
      ? 'calc(var(--sidebar-width-icon) + 1.25rem)'
      : 'calc(var(--sidebar-width) + 1.25rem)';

  return (
    <SidebarInset className="grid grid-cols-1 grid-rows-[auto_1fr_auto] relative overflow-y-auto bg-transparent">
      <Header className="row-start-1 col-start-1 z-40 pointer-events-auto" />
      <div
        className={cn(
          'fixed top-4 z-[60] hidden md:block pointer-events-none transition-[left] duration-200 ease-linear',
        )}
        style={{ left: triggerLeft }}
      >
        <div className="pointer-events-auto">
          <SidebarTrigger className="-ml-1" />
        </div>
      </div>
      <div
        className={cn(
          'row-start-1 col-start-1 z-0',
          // Note: this is done to allow the landing component to bleed into the header
          pathname !== '/' && 'pt-16',
        )}
      >
        {children}
      </div>
      <Footer className="row-start-3 col-start-1" />
    </SidebarInset>
  );
};

Main.displayName = 'Main';
