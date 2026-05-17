'use client';

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  type NotificationPriority,
  isAudibleNotificationPriority,
} from '@namefi-astra/common/shared-schemas';
import { useEffect, useRef, useState } from 'react';
import { useTRPC } from '@/lib/trpc';

import {
  NAMEFI_NOTIF_OPEN_EVENT,
  type NamefiNotifOpenEventDetail,
  getBrowserNotificationCapability,
  hasSurfaced,
  surfaceBrowserNotification,
} from '../browser-notifications';
import { playNewNotificationSound } from '../notification-sound';
import { useNotificationsPollInterval } from '../polling-policy';
import { resourceHref } from '../resource-href';
import { openNotificationsModal } from '../store';

import {
  readSharedDoc$,
  type SharedStateDocType,
  waitForLeadership,
  writeSharedCount,
} from './shared-db';

/**
 * Single-tab polling coordinator for the in-app notifications system.
 *
 * RxDB elects exactly one tab as the leader. Only the leader runs the
 * `getUnreadCount` poll, fetches the list of unseen notifications on a
 * count rise, plays the bell sound, and surfaces OS banners. All other
 * tabs (followers) read the latest count from a shared `localStorage`-
 * backed RxDB document and write it into their react-query cache, so
 * every bell across every tab renders the same value without
 * duplicating the network call.
 *
 * Mounted once via `<LeaderCoordinator />` in `Main`, lazy-loaded by
 * `leader-coordinator-loader.tsx` so the RxDB bytes ship after first
 * paint.
 */

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
function maybeSurfaceItemAsBanner(item: NotificationListItem): void {
  if (hasSurfaced(item.id)) return;
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

function inspectItem(
  item: NotificationListItem,
  canSurface: boolean,
): { audible: boolean } {
  if (canSurface) maybeSurfaceItemAsBanner(item);
  return { audible: isAudibleNotificationPriority(item.priority) };
}

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
        const { audible } = inspectItem(item, canSurface);
        if (audible) anyAudible = true;
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

export function LeaderCoordinator(): null {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const pollInterval = useNotificationsPollInterval();

  const [isLeader, setIsLeader] = useState(false);
  const [sharedDoc, setSharedDoc] = useState<SharedStateDocType | null>(null);

  // Subscribe to the cross-tab shared doc. Runs in EVERY tab — including
  // the leader's own — and writes the latest count into react-query so
  // `useUnreadCount` consumers re-render. `lastUpdatedAt === 0` marks
  // the seeded-but-never-polled state; skip those so we don't briefly
  // flicker a stale cache value to 0 on first mount.
  useEffect(() => {
    const sub = readSharedDoc$().subscribe((doc) => {
      if (!doc) return;
      const json = doc.toJSON() as SharedStateDocType;
      setSharedDoc(json);
      if (json.lastUpdatedAt === 0) return;
      queryClient.setQueryData(trpc.notifications.getUnreadCount.queryKey({}), {
        count: json.count,
      });
    });
    return () => sub.unsubscribe();
  }, [queryClient, trpc.notifications.getUnreadCount]);

  // Race for leadership. `waitForLeadership` only resolves in the
  // elected tab; if another tab keeps the role, this promise just
  // never resolves (and the cleanup flag prevents a stale setState
  // if the component unmounts first).
  useEffect(() => {
    let cancelled = false;
    void waitForLeadership()
      .then((won) => {
        if (!cancelled && won) setIsLeader(true);
      })
      .catch((error) => {
        // RxDB init failure here means we never become the leader.
        // Followers' bells fall back to whatever cached value the
        // shared-doc subscription last delivered (or 0 on first load),
        // which is acceptable — a backend that can return notifications
        // hits the next leader's poll once another tab opens.
        console.error('[LeaderCoordinator] waitForLeadership failed', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Leader-only `useQuery`: this is the ONLY tab making the network
  // call. Followers' `useQuery` instances are inert (`enabled: false`
  // in `useUnreadCount`) and hydrate from the shared doc instead.
  const unreadQuery = useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(
      {},
      {
        refetchInterval: isLeader ? pollInterval : false,
        refetchIntervalInBackground: true,
        staleTime: 0,
      },
    ),
    enabled: isLeader,
  });

  // Leader-only: on every successful poll, push the count into RxDB so
  // followers see it. We deliberately don't `setQueryData` here too —
  // the shared-doc subscription above does it for every tab including
  // this one, keeping a single source of truth.
  useEffect(() => {
    if (!isLeader) return;
    const count = unreadQuery.data?.count;
    if (count === undefined) return;
    void writeSharedCount(count).catch((error) => {
      // A write failure means followers miss THIS tick but the next
      // successful tick overwrites — degrade gracefully, just log so
      // operators can spot systematic storage issues.
      console.error('[LeaderCoordinator] writeSharedCount failed', error);
    });
  }, [isLeader, unreadQuery.data?.count]);

  // Leader-only: respond to `pollNonce` bumps from any tab. Followers
  // bump after local mutations (`markAsSeen` etc.) so the badge updates
  // immediately instead of waiting up to 10s for the next leader tick.
  const lastSeenNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLeader) return;
    const nonce = sharedDoc?.pollNonce;
    if (nonce === undefined) return;
    if (lastSeenNonceRef.current === null) {
      lastSeenNonceRef.current = nonce;
      return;
    }
    if (nonce > lastSeenNonceRef.current) {
      lastSeenNonceRef.current = nonce;
      void unreadQuery.refetch().catch((error) => {
        // react-query usually surfaces fetch errors via `.isError`, but
        // an unexpected throw (e.g. queryFn-side bug) shouldn't become
        // an unhandled-rejection page warning. Same degradation as
        // above — wait for the next regular tick.
        console.error('[LeaderCoordinator] refetch failed', error);
      });
    }
  }, [isLeader, sharedDoc?.pollNonce, unreadQuery.refetch]);

  // Leader-only rise detection. Reads from the SHARED count (not from
  // the local query's data) so the comparison is consistent with what
  // every tab sees and survives a fast leadership handoff. First real
  // observation seeds silently — see `notification-sound.ts` for the
  // autoplay caveat.
  const previousCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLeader) return;
    const count = sharedDoc?.count;
    if (count === undefined) return;
    if (sharedDoc?.lastUpdatedAt === 0) return; // never-polled seed
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    if (previous === null) return;
    if (count <= previous) return;
    void inspectRise({
      queryClient,
      trpc,
      delta: count - previous,
    }).then(({ anyAudible }) => {
      if (anyAudible) playNewNotificationSound();
    });
  }, [isLeader, sharedDoc?.count, sharedDoc?.lastUpdatedAt, queryClient, trpc]);

  // Modal-open listener — fires in every tab. OS banners surface only in
  // the leader, but clicking one fires a custom event in that tab which
  // opens the modal here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<NamefiNotifOpenEventDetail>).detail;
      openNotificationsModal(detail?.filter ?? null);
    };
    window.addEventListener(NAMEFI_NOTIF_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(NAMEFI_NOTIF_OPEN_EVENT, onOpen);
  }, []);

  return null;
}
