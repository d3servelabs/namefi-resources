'use client';

import { HEADER_BADGE_CLASS } from '@/components/header.tokens';
import { HeaderActionButton } from '@/components/header-action-button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { NotificationRelatedResource } from '@namefi-astra/common/shared-schemas';
import NumberFlow from '@number-flow/react';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { requestBrowserNotificationPermissionForce } from './browser-notifications';
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

/**
 * The bell shown in the topbar (mobile), the sidebar footer (desktop), and
 * inline next to resource titles. Same lazy-loaded count, same click-to-
 * open-modal behavior; visual treatment varies by variant.
 *
 * Bumps `animate-bounce` + a pinging dot for ~2.5s whenever the unread
 * count rises while the bell is mounted, so users notice fresh activity
 * without us having to push state.
 *
 * Clicking a global bell (`topbar` / `sidebar`) requests browser-notification
 * permission directly via the native prompt (a real user gesture, per the
 * Notifications API) before opening the modal. Inline bells skip the ask —
 * the global bell is the right place to prompt.
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
  const t = useTranslations('notifications');
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
    // Ask for browser-notification permission directly on the global bell
    // click (the native prompt requires a user gesture). Self-guarded — it
    // only surfaces the dialog while permission is still `default`. The
    // inline (per-resource) bell isn't the place to prompt.
    if (variant !== 'inline') {
      void requestBrowserNotificationPermissionForce();
    }
    openNotificationsModal(filter ?? null);
  }, [variant, filter]);

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
          data-testid="notifications.bell.unread-badge"
          className={cn(
            HEADER_BADGE_CLASS,
            variant === 'sidebar' &&
              'right-1 top-1 group-data-[collapsible=icon]:-right-1.5 group-data-[collapsible=icon]:-top-1.5',
            justIncreased && 'animate-bounce',
          )}
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
            count > 0 ? t('bell.labelWithUnread', { count }) : t('bell.label')
          }
          onClick={handleClick}
          data-testid="notifications.bell.topbar"
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
            count > 0 ? t('bell.labelWithUnread', { count }) : t('bell.label')
          }
          data-testid="notifications.bell.sidebar"
          className={cn(
            'group relative flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60',
            justIncreased && 'animate-bounce',
          )}
        >
          <span className="inline-flex">
            <Bell className="h-4 w-4" />
          </span>
          <span className="group-data-[collapsible=icon]:hidden">
            {t('bell.label')}
          </span>
          {badge}
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
            ? t('bell.relatedLabelWithUnread', { count })
            : t('bell.relatedLabel')
        }
        data-testid="notifications.bell.inline"
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
      {bellInner}
    </div>
  );
});

NotificationsBell.displayName = 'NotificationsBell';
NotificationsBellInner.displayName = 'NotificationsBellInner';
