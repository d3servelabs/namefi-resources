'use client';

import { HEADER_BADGE_CLASS } from '@/components/header.tokens';
import { HeaderActionButton } from '@/components/header-action-button';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@namefi-astra/ui/components/shadcn/popover';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { NotificationRelatedResource } from '@namefi-astra/common/shared-schemas';
import NumberFlow from '@number-flow/react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  dismissPermissionTooltip,
  isPermissionTooltipDismissed,
  requestBrowserNotificationPermissionForce,
  requestBrowserNotificationPermissionOnce,
  useBrowserNotificationCapability,
} from './browser-notifications';
import { openNotificationsModal } from './store';
import { useUnreadCount } from './use-unread-count';

export type NotificationsBellVariant = 'topbar' | 'sidebar' | 'inline';

export type NotificationsBellProps = {
  variant: NotificationsBellVariant;
  filter?: NotificationRelatedResource;
  className?: string;
  /**
   * Only applies to `variant === 'inline'`: when the unread count rises
   * we scroll the bell into view and auto-open the modal filtered to this
   * resource (the "tell me about this domain" behaviour from the spec).
   */
  autoSurfaceOnIncrease?: boolean;
};

export type NotificationsBellHandle = {
  scrollIntoView: () => void;
};

const TOOLTIP_AUTOSHOW_DELAY_MS = 1500;

/**
 * The bell shown in the topbar (mobile), the sidebar footer (desktop), and
 * inline next to resource titles. Same lazy-loaded count, same click-to-
 * open-modal behavior; visual treatment varies by variant.
 *
 * Bumps `animate-bounce` + a pinging dot for ~2.5s whenever the unread
 * count rises while the bell is mounted, so users notice fresh activity
 * without us having to push state.
 *
 * Global bells (`topbar` / `sidebar`) also surface a small popover
 * tooltip when the user hasn't granted browser-notification permission,
 * with Enable / Dismiss actions. Inline bells skip the tooltip — the
 * global one is the right place to ask.
 */
export const NotificationsBell = forwardRef<
  NotificationsBellHandle,
  NotificationsBellProps
>(function NotificationsBell(props, forwardedRef) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) return null;

  return <NotificationsBellInner {...props} ref={forwardedRef} />;
});

const NotificationsBellInner = forwardRef<
  NotificationsBellHandle,
  NotificationsBellProps
>(function NotificationsBellInner(
  { variant, filter, className, autoSurfaceOnIncrease = false },
  forwardedRef,
) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // Tracks the count at which we last auto-surfaced. Prevents re-runs
  // while `justIncreased` is true (~2.5s) when the parent passes an
  // unstable inline `filter` object — the effect would otherwise scroll
  // / open the modal repeatedly per single notification increase.
  const lastAutoSurfacedCountRef = useRef<number>(-1);
  const { count, justIncreased } = useUnreadCount({ filter });

  useImperativeHandle(forwardedRef, () => ({
    scrollIntoView: () => {
      wrapperRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    },
  }));

  const handleClick = useCallback(() => {
    // Self-guarded — only the very first ever click triggers a prompt.
    void requestBrowserNotificationPermissionOnce();
    openNotificationsModal(filter ?? null);
  }, [filter]);

  useEffect(() => {
    if (!autoSurfaceOnIncrease) return;
    if (!justIncreased) return;
    if (lastAutoSurfacedCountRef.current === count) return;
    if (count <= 0 || lastAutoSurfacedCountRef.current === -1) {
      lastAutoSurfacedCountRef.current = 0;
      return;
    }
    lastAutoSurfacedCountRef.current = count;
    wrapperRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    openNotificationsModal(filter ?? null);
    // `count` is the actual trigger; the `lastAutoSurfacedCountRef`
    // guard above short-circuits when `filter` re-renders without a
    // real count change, so an unstable inline `filter` prop won't
    // cause repeated surfaces inside the 2.5s bump window.
  }, [autoSurfaceOnIncrease, justIncreased, count, filter]);

  const badge = (
    <AnimatePresence initial={false} mode="popLayout">
      {count > 0 && (
        <motion.div
          key="notif-badge"
          className={cn(HEADER_BADGE_CLASS, justIncreased && 'animate-bounce')}
          initial={{ opacity: 0, scale: 0.9, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -6 }}
        >
          <NumberFlow value={count} />
          {justIncreased && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-brand-primary opacity-75 animate-ping"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const bellInner = (() => {
    if (variant === 'topbar') {
      return (
        <HeaderActionButton
          type="button"
          actionVariant="icon"
          className={cn('text-white/90', justIncreased && 'animate-bounce')}
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : 'Notifications'
          }
          onClick={handleClick}
        >
          <Bell className="h-5 w-5" />
          {badge}
        </HeaderActionButton>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          type="button"
          onClick={handleClick}
          aria-label={
            count > 0 ? `Notifications, ${count} unread` : 'Notifications'
          }
          className={cn(
            'group relative flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60',
            justIncreased && 'animate-bounce',
          )}
        >
          <span className="relative inline-flex">
            <Bell className="h-4 w-4" />
            {badge}
          </span>
          <span className="group-data-[collapsible=icon]:hidden">
            Notifications
          </span>
        </button>
      );
    }

    // inline variant
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          count > 0
            ? `Related notifications, ${count} unread`
            : 'Related notifications'
        }
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition-colors hover:border-brand-primary/70 hover:bg-brand-primary/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60',
          justIncreased && 'animate-bounce',
        )}
      >
        <Bell className="h-4 w-4" />
        {badge}
      </button>
    );
  })();

  const wrapperClassName = (() => {
    if (variant === 'topbar') return cn('relative', className);
    if (variant === 'sidebar') return cn('w-full', className);
    return cn('relative inline-flex items-center', className);
  })();

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      {variant === 'inline' ? (
        bellInner
      ) : (
        <PermissionPromptTooltip>{bellInner}</PermissionPromptTooltip>
      )}
    </div>
  );
});

NotificationsBell.displayName = 'NotificationsBell';
NotificationsBellInner.displayName = 'NotificationsBellInner';

function PermissionPromptTooltip({ children }: { children: ReactNode }) {
  const capability = useBrowserNotificationCapability();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (capability !== 'default') {
      setOpen(false);
      return;
    }
    if (isPermissionTooltipDismissed()) return;
    const t = setTimeout(() => setOpen(true), TOOLTIP_AUTOSHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [capability]);

  if (capability !== 'default') return <>{children}</>;
  if (isPermissionTooltipDismissed() && !open) return <>{children}</>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton={false}
        render={<span className="inline-block" />}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end" sideOffset={8}>
        <p className="text-sm text-foreground">
          Don't miss any notifications, enable notifications for Namefi Webapp.
        </p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              dismissPermissionTooltip();
              setOpen(false);
            }}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-7 text-xs"
            onClick={async () => {
              await requestBrowserNotificationPermissionForce();
              setOpen(false);
            }}
          >
            Enable
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
