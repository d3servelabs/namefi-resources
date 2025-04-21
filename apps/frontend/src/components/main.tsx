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
    <SidebarInset
      className={cn({
        'bg-transparent': pathname === '/',
      })}
    >
      <Header
        className={cn({
          'bg-transparent': pathname === '/',
        })}
      />
      {children}
      <Footer />
    </SidebarInset>
  );
};

Main.displayName = 'Main';
