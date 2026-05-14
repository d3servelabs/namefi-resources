'use client';

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import { useEffect, useRef } from 'react';

import {
  NAMEFI_NOTIF_OPEN_EVENT,
  type NamefiNotifOpenEventDetail,
  getBrowserNotificationCapability,
  hasSurfaced,
  surfaceBrowserNotification,
} from './browser-notifications';
import { playNewNotificationSound } from './notification-sound';
import { useNotificationsPollInterval } from './polling-policy';
import { resourceHref } from './resource-href';
import { openNotificationsModal } from './store';

/** Page size when draining unseen notifications across a rise. */
const FETCH_PAGE_LIMIT = 25;
/**
 * Hard cap on banners-per-rise so an unread-count jump of e.g. +200
 * (e.g. after a long absence) can't fire 200 OS banners back to back.
 */
const MAX_BANNERS_PER_RISE = 50;

type NotificationListItem = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string;
  relatedResources: Array<{ type: string; identifier: string }>;
};

type NotificationListPage = {
  items: NotificationListItem[];
  nextCursor: string | null;
};

async function surfaceUpToDelta(args: {
  queryClient: QueryClient;
  trpc: ReturnType<typeof useTRPC>;
  delta: number;
}): Promise<void> {
  const { queryClient, trpc, delta } = args;
  if (getBrowserNotificationCapability() !== 'granted') return;
  const target = Math.min(delta, MAX_BANNERS_PER_RISE);
  if (target <= 0) return;
  let surfaced = 0;
  let cursor: string | null = null;
  try {
    while (surfaced < target) {
      const page = (await queryClient.fetchQuery(
        trpc.notifications.list.queryOptions({
          limit: FETCH_PAGE_LIMIT,
          includeArchived: false,
          includeSeen: false,
          cursor,
        }),
      )) as NotificationListPage;
      if (page.items.length === 0) break;
      for (const item of page.items) {
        if (surfaced >= target) break;
        if (hasSurfaced(item.id)) continue;
        const firstResource = (item.relatedResources[0] ?? null) as
          | NamefiNotifOpenEventDetail['filter']
          | null;
        const href = firstResource ? resourceHref(firstResource) : null;
        const ok = surfaceBrowserNotification({
          id: item.id,
          title: item.title,
          body: item.subtitle ?? item.body,
          filter: firstResource,
          href: typeof href === 'string' ? href : null,
        });
        if (ok) surfaced += 1;
      }
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
  } catch {
    // Best-effort — if the list fetch fails, fall back to the
    // bell-only animation and try again on the next rise.
  }
}

/**
 * Single-instance hook that watches the unread count and surfaces OS
 * banners for fresh notifications. Mounted once in `Main` via
 * `<BrowserNotificationWatcher />`. The actual react-query call is
 * shared with the bell — react-query dedupes by key, so this hook
 * adds no extra network cost in the foreground.
 *
 * Bell animation behavior is unchanged. This hook only fires the OS
 * banner; the bell handles its own animate-bounce/ping locally.
 */
export function useBrowserNotificationWatcher(): void {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const pollInterval = useNotificationsPollInterval();

  const countQuery = useQuery(
    trpc.notifications.getUnreadCount.queryOptions(
      {},
      {
        // Shares the cache key with the bell — react-query dedupes the
        // network call so this is effectively free in the foreground.
        refetchInterval: pollInterval,
        refetchIntervalInBackground: true,
        // Refocus must refetch immediately; see comment in
        // `use-unread-count.ts`.
        staleTime: 0,
      },
    ),
  );
  const count = countQuery.data?.count ?? 0;
  const previousCountRef = useRef<number | null>(null);

  useEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    // First observation never fires — same semantics as the bell.
    if (previous === null) return;
    if (count <= previous) return;

    playNewNotificationSound();
    void surfaceUpToDelta({
      queryClient,
      trpc,
      delta: count - previous,
    });
  }, [count, queryClient, trpc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<NamefiNotifOpenEventDetail>).detail;
      openNotificationsModal(detail?.filter ?? null);
    };
    window.addEventListener(NAMEFI_NOTIF_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(NAMEFI_NOTIF_OPEN_EVENT, onOpen);
  }, []);
}
