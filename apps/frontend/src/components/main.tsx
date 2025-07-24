'use client';

import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import { SidebarInset } from './ui/shadcn/sidebar';

export const Main = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  return (
    <SidebarInset className="grid grid-cols-1 grid-rows-[auto_1fr_auto] relative overflow-y-auto bg-transparent">
      <Header className="row-start-1 col-start-1 z-40 pointer-events-auto" />
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
