'use client';

import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  type NotificationPriority,
  isAudibleNotificationPriority,
} from '@namefi-astra/common/shared-schemas';
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
  priority: NotificationPriority;
  relatedResources: Array<{ type: string; identifier: string }>;
};

type NotificationListPage = {
  items: NotificationListItem[];
  nextCursor: string | null;
};

/**
 * Walks the rising-set of unseen notifications once, performing two
 * jobs in lockstep:
 *
 * 1. Decide whether the bell sound should play — true iff at least one
 *    item in the rise is `'normal'` priority or higher.
 * 2. If OS-banner permission is granted, surface up to
 *    `MAX_BANNERS_PER_RISE` banners.
 *
 * Folded into a single pass so we don't fetch the same page twice.
 * `target` always equals the visit budget (`min(delta, MAX_…)`); banners
 * are surfaced only when capability allows but we still inspect every
 * visited item for the sound decision.
 */
async function inspectRise(args: {
  queryClient: QueryClient;
  trpc: ReturnType<typeof useTRPC>;
  delta: number;
}): Promise<{ anyAudible: boolean }> {
  const { queryClient, trpc, delta } = args;
  const target = Math.min(delta, MAX_BANNERS_PER_RISE);
  if (target <= 0) return { anyAudible: false };
  const canSurface = getBrowserNotificationCapability() === 'granted';
  let visited = 0;
  let anyAudible = false;
  let cursor: string | null = null;
  try {
    while (visited < target) {
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
        if (visited >= target) break;
        visited += 1;
        if (isAudibleNotificationPriority(item.priority)) anyAudible = true;
        if (!canSurface) continue;
        if (hasSurfaced(item.id)) continue;
        const firstResource = (item.relatedResources[0] ?? null) as
          | NamefiNotifOpenEventDetail['filter']
          | null;
        const href = firstResource ? resourceHref(firstResource) : null;
        surfaceBrowserNotification({
          id: item.id,
          title: item.title,
          body: item.subtitle ?? item.body,
          filter: firstResource,
          href: typeof href === 'string' ? href : null,
        });
      }
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
  } catch {
    // Best-effort — if the list fetch fails, fall back to the
    // bell-only animation and try again on the next rise.
  }
  return { anyAudible };
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
  // Deliberately keep `count` as `number | undefined`: while the first
  // fetch is in flight `countQuery.data` is `undefined`, and we must
  // not seed the ref from a `0` fallback — otherwise the initial
  // `0 → N` transition when the real fetch lands would look like a rise
  // and play a sound on every page load.
  const count = countQuery.data?.count;
  const previousCountRef = useRef<number | null>(null);

  useEffect(() => {
    // No real observation yet — don't touch the ref, don't compare.
    if (count === undefined) return;
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    // First *real* observation seeds the baseline silently. Sound only
    // fires when a subsequent poll returns a strictly higher count.
    if (previous === null) return;
    if (count <= previous) return;

    // Inspect the rising-set once: we need the priority of the new
    // items to decide whether to play the sound, and the surface pass
    // can piggy-back on the same fetch (one page over the wire, not
    // two). Sound plays only if `anyAudible` (≥ `'normal'`).
    void inspectRise({
      queryClient,
      trpc,
      delta: count - previous,
    }).then(({ anyAudible }) => {
      if (anyAudible) playNewNotificationSound();
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
