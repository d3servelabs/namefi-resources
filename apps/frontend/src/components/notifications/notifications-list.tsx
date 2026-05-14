'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  notificationResourceTypeValues,
  type NotificationRelatedResource,
  type NotificationResourceType,
} from '@namefi-astra/common/shared-schemas';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import {
  Archive,
  ArchiveRestore,
  Check,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { NotificationItem } from './notification-item';

export type NotificationsListProps = {
  initialFilter: NotificationRelatedResource | null;
};

const PAGE_LIMIT = 25;

export function NotificationsList({ initialFilter }: NotificationsListProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState<NotificationResourceType | ''>(
    initialFilter?.type ?? '',
  );
  const [filterIdentifier, setFilterIdentifier] = useState<string>(
    initialFilter?.identifier ?? '',
  );
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeSeen, setIncludeSeen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Re-seed filter from props if the caller opens the modal with a different
  // resource than before. We intentionally don't sync the other direction —
  // the user can override filters from inside the modal.
  useEffect(() => {
    setFilterType(initialFilter?.type ?? '');
    setFilterIdentifier(initialFilter?.identifier ?? '');
    setSelectedIds(new Set());
  }, [initialFilter?.type, initialFilter?.identifier]);

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
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(infiniteQueryOptions);

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

  const invalidateNotifications = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: trpc.notifications.pathKey(),
    });
  }, [queryClient, trpc.notifications]);

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
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as NotificationResourceType | '')
          }
          className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-xs"
          aria-label="Filter by resource type"
        >
          <option value="">Any type</option>
          {notificationResourceTypeValues.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterIdentifier}
          onChange={(e) => setFilterIdentifier(e.target.value)}
          placeholder="Identifier"
          className="h-8 w-44 rounded-md border border-white/10 bg-transparent px-2 text-xs"
          aria-label="Filter by resource identifier"
        />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Checkbox
            checked={includeSeen}
            onCheckedChange={(v) => setIncludeSeen(v === true)}
            aria-label="Include seen notifications"
          />
          Include seen
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Checkbox
            checked={includeArchived}
            onCheckedChange={(v) => setIncludeArchived(v === true)}
            aria-label="Include archived notifications"
          />
          Include archived
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-8 text-xs"
          onClick={() => void refetch()}
        >
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all visible notifications"
          />
          {hasSelection
            ? `${selectedArray.length} selected`
            : 'Select all on page'}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!hasSelection || markAsSeenMutation.isPending}
            onClick={() => markAsSeenMutation.mutate({ ids: selectedArray })}
          >
            <Check className="mr-1 size-3.5" /> Seen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!hasSelection || markAsUnseenMutation.isPending}
            onClick={() => markAsUnseenMutation.mutate({ ids: selectedArray })}
          >
            <RotateCcw className="mr-1 size-3.5" /> Unseen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!hasSelection || archiveMutation.isPending}
            onClick={() => archiveMutation.mutate({ ids: selectedArray })}
          >
            <Archive className="mr-1 size-3.5" /> Archive
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!hasSelection || unarchiveMutation.isPending}
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
