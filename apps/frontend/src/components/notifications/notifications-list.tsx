'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  notificationResourceTypeValues,
  type NotificationRelatedResource,
  type NotificationResourceType,
} from '@namefi-astra/common/shared-schemas';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Filter as FilterIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useInvalidateNotifications } from '@/hooks/use-invalidate-notifications';

import { NotificationItem } from './notification-item';

export type NotificationsListProps = {
  initialFilter: NotificationRelatedResource | null;
};

const PAGE_LIMIT = 25;

/**
 * Sentinel value for the "Related to" select. base-ui's Select doesn't
 * allow `value=""`, so we route "no filter" through this constant and
 * map it back to undefined at the query boundary.
 */
const RELATED_TO_ANY = '__any__';

const RELATED_TO_LABELS: Record<NotificationResourceType, string> = {
  user: 'User',
  domain: 'Domain',
  wallet: 'Wallet',
  order: 'Order',
  order_item: 'Order item',
  payment: 'Payment',
  cart: 'Cart',
  dns_record: 'DNS record',
};

export function NotificationsList({ initialFilter }: NotificationsListProps) {
  const trpc = useTRPC();
  const invalidateNotifications = useInvalidateNotifications();

  const [filterType, setFilterType] = useState<NotificationResourceType | ''>(
    initialFilter?.type ?? '',
  );
  const [filterIdentifier, setFilterIdentifier] = useState<string>(
    initialFilter?.identifier ?? '',
  );
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeSeen, setIncludeSeen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Filters are hidden by default behind a Filter icon; auto-open when
  // the caller pre-seeded a filter so the user can see what's active.
  const [filtersOpen, setFiltersOpen] = useState(() => Boolean(initialFilter));

  // Re-seed filter from props if the caller opens the modal with a different
  // resource than before. We intentionally don't sync the other direction —
  // the user can override filters from inside the modal.
  useEffect(() => {
    setFilterType(initialFilter?.type ?? '');
    setFilterIdentifier(initialFilter?.identifier ?? '');
    setSelectedIds(new Set());
    if (initialFilter) setFiltersOpen(true);
  }, [initialFilter?.type, initialFilter?.identifier, initialFilter]);

  const baseInput = useMemo(
    () => ({
      limit: PAGE_LIMIT,
      includeArchived,
      includeSeen,
      ...(filterType
        ? { relatedResourceType: filterType as NotificationResourceType }
        : {}),
      ...(filterIdentifier
        ? { relatedResourceIdentifier: filterIdentifier }
        : {}),
    }),
    [filterType, filterIdentifier, includeArchived, includeSeen],
  );

  const infiniteQueryOptions = trpc.notifications.list.infiniteQueryOptions(
    baseInput,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: null as string | null,
    },
  );
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(infiniteQueryOptions);

  // Refetch once when the list mounts — i.e. when the modal opens (the
  // modal renders `NotificationsList` only while open, so a mount effect
  // fires on every open). The global 60s `staleTime` would otherwise
  // serve a possibly-stale cache on reopen.
  useEffect(() => {
    void refetch();
    // Mount-only — `refetch` is stable from react-query.
  }, [refetch]);

  const items = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.items),
    [data],
  );

  // Prune `selectedIds` to only ids currently in the visible list. Without
  // this, bulk actions could target rows that filter / refetch has hidden
  // (e.g. selecting an unseen notification, then ticking "Include seen" off,
  // then clicking Archive — would archive an item the user can no longer see).
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(items.map((item) => item.id));
      const next = new Set(Array.from(prev).filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  // Infinite-scroll sentinel — same native IntersectionObserver pattern used
  // in mls-feed.tsx.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const markAsSeenMutation = useMutation(
    trpc.notifications.markAsSeen.mutationOptions({
      onSuccess: invalidateNotifications,
      onError: (error) =>
        toast.error('Failed to mark as seen', { description: error.message }),
    }),
  );
  const markAsUnseenMutation = useMutation(
    trpc.notifications.markAsUnseen.mutationOptions({
      onSuccess: invalidateNotifications,
      onError: (error) =>
        toast.error('Failed to mark as unseen', { description: error.message }),
    }),
  );
  const archiveMutation = useMutation(
    trpc.notifications.archive.mutationOptions({
      onSuccess: () => {
        invalidateNotifications();
        setSelectedIds(new Set());
      },
      onError: (error) =>
        toast.error('Failed to archive', { description: error.message }),
    }),
  );
  const unarchiveMutation = useMutation(
    trpc.notifications.unarchive.mutationOptions({
      onSuccess: invalidateNotifications,
      onError: (error) =>
        toast.error('Failed to restore', { description: error.message }),
    }),
  );
  const markAllAsSeenMutation = useMutation(
    trpc.notifications.markAllAsSeen.mutationOptions({
      onSuccess: invalidateNotifications,
      onError: (error) =>
        toast.error('Failed to mark all as seen', {
          description: error.message,
        }),
    }),
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected =
    items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const someSelected = !allSelected && items.some((i) => selectedIds.has(i.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        for (const i of items) next.delete(i.id);
        return next;
      }
      const next = new Set(prev);
      for (const i of items) next.add(i.id);
      return next;
    });
  };

  const selectedArray = Array.from(selectedIds);
  const hasSelection = selectedArray.length > 0;

  return (
    <div className="flex h-full max-h-[70vh] flex-col gap-3">
      {/* Toolbar — always shows the Filter toggle + Refresh; filters
          themselves slide open below it. */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <Button
          type="button"
          variant={filtersOpen ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="notifications-filters"
        >
          <FilterIcon className="mr-1 size-3.5" />
          Filters
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Refresh notifications"
        >
          <RefreshCw
            className={cn('mr-1 size-3.5', isFetching && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>

      {filtersOpen && (
        <div
          id="notifications-filters"
          className="grid grid-cols-1 gap-3 rounded-md border border-border/40 bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto]"
        >
          <div className="flex flex-col gap-1">
            <span
              id="notifications-related-to-label"
              className="text-[11px] font-medium text-muted-foreground"
            >
              Related to
            </span>
            <Select
              value={filterType === '' ? RELATED_TO_ANY : filterType}
              onValueChange={(value) => {
                setFilterType(
                  value === RELATED_TO_ANY
                    ? ''
                    : (value as NotificationResourceType),
                );
              }}
            >
              <SelectTrigger
                className="h-8 text-xs"
                aria-labelledby="notifications-related-to-label"
              >
                <SelectValue placeholder="Any">
                  {(value: string | null) => {
                    if (!value || value === RELATED_TO_ANY) return 'Any';
                    return (
                      RELATED_TO_LABELS[value as NotificationResourceType] ??
                      value
                    );
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RELATED_TO_ANY}>Any</SelectItem>
                {notificationResourceTypeValues.map((t) => (
                  <SelectItem key={t} value={t}>
                    {RELATED_TO_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Name or key
            </span>
            <input
              type="text"
              value={filterIdentifier}
              onChange={(e) => setFilterIdentifier(e.target.value)}
              placeholder="name or key"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="Name or key"
            />
          </div>

          <span className="flex items-end gap-2 text-xs text-muted-foreground sm:items-center">
            <Checkbox
              checked={includeSeen}
              onCheckedChange={(v) => setIncludeSeen(v === true)}
              aria-label="Include seen notifications"
            />
            Include seen
          </span>
          <span className="flex items-end gap-2 text-xs text-muted-foreground sm:items-center">
            <Checkbox
              checked={includeArchived}
              onCheckedChange={(v) => setIncludeArchived(v === true)}
              aria-label="Include archived notifications"
            />
            Include archived
          </span>
        </div>
      )}

      {/* Bulk-action toolbar is hidden until at least one row is
          selected. Per-row controls inside `NotificationItem` are still
          available, which is how the user produces the selection in the
          first place. */}
      {hasSelection && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-brand-primary/30 bg-brand-primary/5 px-2 py-1.5">
          <span className="flex items-center gap-2 text-xs text-foreground">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all visible notifications"
            />
            {selectedArray.length} selected
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={markAsSeenMutation.isPending}
              onClick={() => markAsSeenMutation.mutate({ ids: selectedArray })}
            >
              <Eye className="mr-1 size-3.5" /> Seen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={markAsUnseenMutation.isPending}
              onClick={() =>
                markAsUnseenMutation.mutate({ ids: selectedArray })
              }
            >
              <EyeOff className="mr-1 size-3.5" /> Unseen
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate({ ids: selectedArray })}
            >
              <Archive className="mr-1 size-3.5" /> Archive
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={unarchiveMutation.isPending}
              onClick={() => unarchiveMutation.mutate({ ids: selectedArray })}
            >
              <ArchiveRestore className="mr-1 size-3.5" /> Restore
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAllAsSeenMutation.isPending}
              onClick={() =>
                markAllAsSeenMutation.mutate({
                  ...(filterType
                    ? {
                        relatedResourceType:
                          filterType as NotificationResourceType,
                      }
                    : {}),
                  ...(filterIdentifier
                    ? { relatedResourceIdentifier: filterIdentifier }
                    : {}),
                })
              }
            >
              Mark all as seen
            </Button>
          </div>
        </div>
      )}

      <div className="-mx-2 flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No notifications.
          </div>
        ) : (
          <ul className={cn('flex flex-col gap-2 pb-4')}>
            {items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                selected={selectedIds.has(notification.id)}
                onToggleSelected={toggleSelected}
                onMarkSeen={(id) => markAsSeenMutation.mutate({ ids: [id] })}
                onMarkUnseen={(id) =>
                  markAsUnseenMutation.mutate({ ids: [id] })
                }
                onArchive={(id) => archiveMutation.mutate({ ids: [id] })}
                onUnarchive={(id) => unarchiveMutation.mutate({ ids: [id] })}
                onAutoMarkSeen={(id) =>
                  markAsSeenMutation.mutate({ ids: [id], autoMarked: true })
                }
              />
            ))}
          </ul>
        )}
        {hasNextPage && (
          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-2 text-xs text-muted-foreground"
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Loading more…'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
