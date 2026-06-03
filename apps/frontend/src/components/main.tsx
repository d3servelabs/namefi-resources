'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import { LeaderCoordinator } from './notifications/leader/leader-coordinator-loader';
import { NotificationsModal } from './notifications/notifications-modal';
import {
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@namefi-astra/ui/components/shadcn/sidebar';
import { isLandingPath } from '@/lib/origin/keys';

// Lazy-loaded: keeps embla-carousel, the Alert primitives, and icons out of the
// app-shell bundle. The banner fetches its data client-side and reads
// localStorage for dismissals, so it has no SSR value (ssr: false).
const AnnouncementsBanner = dynamic(
  () => import('./AnnouncementsBanner').then((m) => m.AnnouncementsBanner),
  { ssr: false },
);

export const Main = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { state } = useSidebar();
  const triggerLeft =
    state === 'collapsed'
      ? 'calc(var(--sidebar-width-icon) + 1.25rem)'
      : 'calc(var(--sidebar-width) + 1.25rem)';

  return (
    <SidebarInset className="relative flex h-svh min-h-0 flex-col overflow-hidden bg-transparent">
      {/* Pinned announcement strip above the header; scrolls nothing. */}
      <AnnouncementsBanner />
      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_1fr_auto] overflow-y-auto">
        <Header className="row-start-1 col-start-1 z-40 pointer-events-auto" />
        <div
          className={cn(
            'fixed z-[60] hidden md:block pointer-events-none transition-[left] duration-200 ease-linear',
          )}
          style={{
            left: triggerLeft,
            top: 'calc(1rem + var(--announcement-strip-height, 0px))',
          }}
        >
          <div className="pointer-events-auto">
            <SidebarTrigger className="-ml-1" />
          </div>
        </div>
        <div
          className={cn(
            'row-start-1 col-start-1 z-0',
            // Note: this is done to allow the landing component to bleed into the header
            !isLandingPath(pathname) && 'pt-16',
          )}
        >
          {children}
        </div>
        <Footer className="row-start-3 col-start-1" />
      </div>
      <NotificationsModal />
      <LeaderCoordinator />
    </SidebarInset>
  );
};

Main.displayName = 'Main';
