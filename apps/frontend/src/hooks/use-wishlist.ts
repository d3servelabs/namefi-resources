import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from 'usehooks-ts';
import PQueue from 'p-queue';
import { useAuth } from '@/hooks/use-auth';
import {
  useTRPC,
  type AppRouterInput,
  type AppRouterOutput,
} from '@/utils/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

/**
 * Shared queue for wishlist operations to ensure sequential updates.
 */
export const wishlistQueue = new PQueue({ concurrency: 1 });

const OPTIMISTIC = '__optimistic' as const;
const PENDING_DELETE = '__pendingDelete' as const;
export const wishlistDomainKey = (userId: string, domain: string) =>
  `${userId}:${domain}`;
export type ServerReadWishlistItem =
  AppRouterOutput['users']['getWishlistDomains'][number];
export type ServerWriteWishlistItem =
  AppRouterInput['users']['toggleWishlistDomain'][number];

/**
 * Tag for marking an item as pending delete (optimistic UI)
 */
type PendingDeleteTag = { [PENDING_DELETE]: true };
/**
 * Tag for marking an item as optimistic (not yet confirmed by server)
 */
type OptimisticTag = { [OPTIMISTIC]: true };

export type UnifiedWishlistItem = ServerReadWishlistItem &
  Partial<PendingDeleteTag>;

type Optimistic<T> = T & OptimisticTag;
type MaybeOptimistic<T> = T & Partial<OptimisticTag>;
type MaybeOptimisticUnifiedWishlistItem = MaybeOptimistic<UnifiedWishlistItem>;
type OptimisticUnifiedWishlistItem = Optimistic<UnifiedWishlistItem>;
type PendingDeleteUnified = UnifiedWishlistItem & PendingDeleteTag;

/**
 * Type guard for checking if an item is pending delete
 */
export function isPendingDelete(
  item: UnifiedWishlistItem | PendingDeleteUnified,
): item is PendingDeleteUnified {
  return !!item && typeof item === 'object' && PENDING_DELETE in item;
}

export const GUEST_USER_ID = 'guest';

/**
 * Mark a wishlist item as optimistic (for local/optimistic UI)
 * @param i - The wishlist item
 * @param userId - The user ID
 */
const markOptimistic = (
  i: ServerWriteWishlistItem,
  userId: string,
): OptimisticUnifiedWishlistItem => ({
  ...i,
  id: deterministicId(i.normalizedDomainName, userId),
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  normalizedDomainName: i.normalizedDomainName as NamefiNormalizedDomain,
  [OPTIMISTIC]: true,
});

const isOptimistic = (i: unknown): i is OptimisticTag =>
  Boolean(i && typeof i === 'object' && OPTIMISTIC in i);

/**
 * Remove the optimistic tag from an item
 */
const stripOptimistic = <T extends object>(i: MaybeOptimistic<T>) => {
  const { [OPTIMISTIC]: _, ...rest } = i;
  return rest as T;
};

const stripForLocalStorage = <T extends MaybeOptimisticUnifiedWishlistItem>(
  i: T,
) => {
  const stripped = stripOptimistic(i);
  return {
    ...stripped,
  };
};

// Utility to compute the localStorage key
function getWishlistLocalStorageKey(userId?: string) {
  return `user-wishlist-domains:${userId ?? GUEST_USER_ID}`;
}

// Deterministic ID generator for wishlist items (browser-safe, simple hash)
function deterministicId(domain: string, user: string): string {
  // djb2 hash
  let hash = 5381;
  const str = `${user}:${domain}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return `w_${(hash >>> 0).toString(16)}`;
}

// Helper to ensure a stable ID per item (pure, no mutation)
const ensureId = <
  T extends { id?: string; normalizedDomainName: string; userId?: string },
>(
  i: T,
  userId: string,
): string => {
  if (i.id) return i.id;
  // Use deterministic ID based on domain and user
  return deterministicId(i.normalizedDomainName, i.userId ?? userId);
};

// Move normalize to file scope so both hooks can use it
const normalizeWishlistItems = (
  items: (ServerReadWishlistItem | UnifiedWishlistItem)[],
  isAuthenticated: boolean,
  userId?: string,
): UnifiedWishlistItem[] =>
  items.map((item) => {
    const effectiveUserId =
      item.userId ??
      (isAuthenticated ? (userId ?? GUEST_USER_ID) : GUEST_USER_ID);
    const id = ensureId(item, effectiveUserId);
    // If [PENDING_DELETE] in item, return as PendingDeleteUnified for type soundness
    if (PENDING_DELETE in item) {
      return {
        ...stripOptimistic(item),
        id,
        userId: effectiveUserId,
        normalizedDomainName:
          item.normalizedDomainName as NamefiNormalizedDomain,
        [PENDING_DELETE]: true,
      };
    }
    return {
      ...stripOptimistic(item),
      id,
      userId: effectiveUserId,
      normalizedDomainName: item.normalizedDomainName as NamefiNormalizedDomain,
    };
  });

/* -------------------------------------------------------------------------- */
/*                             BUSY STATE HOOK                               */
/* -------------------------------------------------------------------------- */

/**
 * Hook for managing busy state for wishlist operations
 */
export function useWishlistBusy() {
  type BusyKey = string;
  type BusyAction =
    | { type: 'mark'; key: BusyKey }
    | { type: 'clear'; key: BusyKey }
    | { type: 'clearAll' };

  function busyReducer(state: Set<BusyKey>, action: BusyAction): Set<BusyKey> {
    switch (action.type) {
      case 'mark': {
        const next = new Set(state);
        next.add(action.key);
        return next;
      }
      case 'clear': {
        const next = new Set(state);
        next.delete(action.key);
        return next;
      }
      case 'clearAll':
        return new Set();
    }
  }

  const [busyIds, dispatchBusy] = useReducer(busyReducer, new Set<BusyKey>());

  useEffect(() => () => dispatchBusy({ type: 'clearAll' }), []); // Clean up busy state on unmount

  const markBusy = useCallback(
    (key: BusyKey) => dispatchBusy({ type: 'mark', key }),
    [],
  );
  const clearBusy = useCallback(
    (key: BusyKey) => dispatchBusy({ type: 'clear', key }),
    [],
  );
  const isBusy = useCallback((key: BusyKey) => busyIds.has(key), [busyIds]);

  return { busyIds, markBusy, clearBusy, isBusy };
}

/* -------------------------------------------------------------------------- */
/*                           LOCAL STORAGE HOOK                              */
/* -------------------------------------------------------------------------- */

/**
 * Hook for managing local wishlist state (for unauthenticated users)
 */
export function useWishlistLocal() {
  const { user, isLoading: isUserLoading } = useAuth();
  const localStorageKey = useMemo(
    () =>
      getWishlistLocalStorageKey(
        !isUserLoading && user?.id ? user.id : undefined,
      ),
    [user?.id, isUserLoading],
  );

  const deserialize = useCallback(
    (item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    }),
    [],
  );

  const serialize = useCallback(
    (item: UnifiedWishlistItem) => ({
      ...item,
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
    }),
    [],
  );

  const [localWishlist, setLocalWishlist, clearLocalWishlistRaw] =
    useLocalStorage<UnifiedWishlistItem[]>(localStorageKey, [], {
      initializeWithValue: true,
      serializer: (value: UnifiedWishlistItem[]) =>
        JSON.stringify(value.map(serialize)),
      deserializer: (value: string) => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed.map(deserialize) : [];
        } catch {
          return [];
        }
      },
    });

  // Helper to clear both guest and user keys
  const clearAllLocalWishlists = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(
          getWishlistLocalStorageKey(GUEST_USER_ID),
        );
        if (user?.id) {
          window.localStorage.removeItem(getWishlistLocalStorageKey(user.id));
        }
      } catch (err) {
        console.error('Failed to clear local wishlist', err);
      }
    }
  }, [user?.id]);

  // Helper to clear only the current key
  const clearLocalWishlist = useCallback(() => {
    clearLocalWishlistRaw();
  }, [clearLocalWishlistRaw]);

  const addLocalItems = useCallback(
    (items: UnifiedWishlistItem[]) => {
      setLocalWishlist((prev) => [...prev, ...items.map(stripForLocalStorage)]);
    },
    [setLocalWishlist],
  );

  const removeLocalByDomain = useCallback(
    (domains: NamefiNormalizedDomain[]) => {
      const removedLocal = localWishlist.filter((i) =>
        domains.includes(i.normalizedDomainName),
      );
      setLocalWishlist((prev) =>
        prev.filter((i) => !domains.includes(i.normalizedDomainName)),
      );
      return removedLocal;
    },
    [localWishlist, setLocalWishlist],
  );

  return useMemo(
    () => ({
      localWishlist,
      addLocalItems,
      removeLocalByDomain,
      clearLocalWishlist,
      clearAllLocalWishlists,
    }),
    [
      localWishlist,
      addLocalItems,
      removeLocalByDomain,
      clearLocalWishlist,
      clearAllLocalWishlists,
    ],
  );
}

/* -------------------------------------------------------------------------- */
/*                           SERVER SYNC HOOK                                */
/* -------------------------------------------------------------------------- */

/**
 * Hook for syncing wishlist state with the server (for authenticated users)
 * Handles optimistic updates and local-to-server sync on login
 */
export function useWishlistServerSync() {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isUserLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const busy = useWishlistBusy();
  const local = useWishlistLocal();

  const WishlistKey = useMemo(
    () => trpc.users.getWishlistDomains.queryKey(),
    [trpc],
  );

  // Rollback for optimistic updates
  const rollback = useCallback(
    (ctx?: { prev?: UnifiedWishlistItem[] }) => {
      if (!ctx?.prev) return;
      queryClient.setQueryData(WishlistKey, ctx.prev.map(stripOptimistic));
    },
    [queryClient, WishlistKey],
  );

  // Normalize wishlist items (ensure required fields)
  const normalize = useCallback(
    (items: (ServerReadWishlistItem | UnifiedWishlistItem)[]) =>
      normalizeWishlistItems(
        items,
        isAuthenticated && !isUserLoading && !!user?.id,
        !isUserLoading && user?.id ? user.id : undefined,
      ),
    [isAuthenticated, isUserLoading, user?.id],
  );

  // Merge by domain (for optimistic updates)
  const mergeByDomain = (
    delta: UnifiedWishlistItem[],
    base: UnifiedWishlistItem[] = [],
  ) => {
    const map = new Map(base.map((i) => [i.normalizedDomainName, i]));
    delta.forEach((i) => map.set(i.normalizedDomainName, i));
    return [...map.values()];
  };

  // Query for wishlist data
  useEffect(() => {
    queryClient.setQueryDefaults(WishlistKey, {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      meta: { abortOnUnmount: true },
    });
  }, [queryClient, WishlistKey]);

  const { data: serverData, isLoading: isServerLoading } = useQuery({
    ...trpc.users.getWishlistDomains.queryOptions(),
    enabled: isAuthenticated && !isUserLoading && !!user?.id,
  });

  const wishlistData = useMemo(() => {
    const src =
      isAuthenticated && !isUserLoading && user?.id
        ? serverData
        : local.localWishlist;
    if (!src) return undefined;
    return normalize(
      src
        .slice()
        .sort(
          (a, b) =>
            (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
        ),
    );
  }, [
    isAuthenticated,
    isUserLoading,
    user?.id,
    serverData,
    local.localWishlist,
    normalize,
  ]);

  const isDomainWishlisted = useCallback(
    (d: string) =>
      wishlistData?.some((i) => i.normalizedDomainName === d) ?? false,
    [wishlistData],
  );

  const isDomainBusy = useCallback(
    (domain: string) => {
      const currentUserId = user?.id ?? GUEST_USER_ID;
      if (busy.isBusy(wishlistDomainKey(currentUserId, domain))) return true;
      const maybeIds =
        wishlistData
          ?.filter((i) => i.normalizedDomainName === domain)
          .map((i) => i.id) ?? [];
      return maybeIds.some((id) => id && busy.isBusy(id));
    },
    [busy, wishlistData, user?.id],
  );

  // Mutations
  const addMutation = useMutation({
    ...trpc.users.toggleWishlistDomain.mutationOptions(),
    retry: (failCount, err) => {
      const status = err?.data?.httpStatus;
      return (status === undefined || status >= 500) && failCount < 3;
    },
    onMutate: async (payload: ServerWriteWishlistItem[]) => {
      await queryClient.cancelQueries({ queryKey: WishlistKey });
      const prev =
        queryClient.getQueryData<UnifiedWishlistItem[]>(WishlistKey) ?? [];
      const optimistic = normalize(
        payload.map((p) => markOptimistic(p, user?.id ?? GUEST_USER_ID)),
      );
      queryClient.setQueryData(WishlistKey, mergeByDomain(optimistic, prev));
      const touched = payload.map((p) =>
        wishlistDomainKey(user?.id ?? GUEST_USER_ID, p.normalizedDomainName),
      );
      return { prev, keys: touched };
    },
    onError: (_e, _v, ctx) => {
      rollback(ctx);
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSuccess: (server, _vars, ctx) => {
      const authoritative = normalize(server);
      queryClient.setQueryData(
        WishlistKey,
        (old: UnifiedWishlistItem[] = []) => {
          const map = new Map(old.map((i) => [i.normalizedDomainName, i]));
          authoritative.forEach((s) => {
            const existing = map.get(s.normalizedDomainName);
            if (existing && isOptimistic(existing))
              map.set(s.normalizedDomainName, s);
          });
          // Remove any remaining optimistic items not returned by the server
          const authoritativeDomains = new Set(
            authoritative.map((s) => s.normalizedDomainName),
          );
          return [...map.values()].filter(
            (item) =>
              !isOptimistic(item) ||
              authoritativeDomains.has(item.normalizedDomainName),
          );
        },
      );
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WishlistKey,
        refetchType: 'inactive',
        exact: true,
      });
    },
  });

  const removeMutation = useMutation({
    ...trpc.users.toggleWishlistDomain.mutationOptions(),
    retry: (failCount, err) => {
      const status = err?.data?.httpStatus;
      return (status === undefined || status >= 500) && failCount < 3;
    },
    onMutate: async (payload: ServerWriteWishlistItem[]) => {
      const touchedIds: string[] = [];
      wishlistData?.forEach((item) => {
        if (
          payload.some(
            (p) => p.normalizedDomainName === item.normalizedDomainName,
          ) &&
          item.id
        ) {
          busy.markBusy(item.id);
          touchedIds.push(item.id);
        }
      });
      await queryClient.cancelQueries({ queryKey: WishlistKey });
      const prev = queryClient.getQueryData<UnifiedWishlistItem[]>(WishlistKey);
      // Mark items as pending delete instead of removing them
      queryClient.setQueryData(WishlistKey, (old: UnifiedWishlistItem[] = []) =>
        old.map((item) =>
          touchedIds.includes(item.id)
            ? { ...item, [PENDING_DELETE]: true }
            : item,
        ),
      );
      return { prev, keys: touchedIds };
    },
    onError: (_e, _v, ctx) => {
      rollback(ctx);
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSuccess: (removed, _vars, ctx) => {
      const removedSet = new Set(removed.map((i) => i.normalizedDomainName));
      queryClient.setQueryData(
        WishlistKey,
        (old: UnifiedWishlistItem[] = []) => {
          return old.filter(
            (i) =>
              !(
                removedSet.has(i.normalizedDomainName) &&
                !isOptimistic(i) &&
                !isPendingDelete(i)
              ),
          );
        },
      );
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: WishlistKey,
        refetchType: 'inactive',
        exact: true,
      });
    },
  });

  // Sync local to server on login
  const syncing = useRef(false);
  useEffect(() => {
    if (
      !isAuthenticated ||
      isUserLoading ||
      !user?.id ||
      !local.localWishlist.length ||
      syncing.current
    )
      return;
    syncing.current = true;

    const syncTask = async () => {
      try {
        const writes: ServerWriteWishlistItem[] = local.localWishlist.map(
          (i) => ({
            normalizedDomainName: i.normalizedDomainName,
            isWishlisted: true,
          }),
        );
        if (writes.length) {
          await addMutation.mutateAsync(writes);
        }
        // Clear both guest and user keys after sync
        local.clearAllLocalWishlists();
      } finally {
        syncing.current = false;
      }
    };
    wishlistQueue.add(syncTask);
    return () => {
      syncing.current = false;
    };
  }, [
    isAuthenticated,
    isUserLoading,
    user,
    local.localWishlist,
    local.clearAllLocalWishlists,
    addMutation,
  ]);

  // Clear all local wishlists on logout
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current && (!isAuthenticated || isUserLoading || !user?.id)) {
      local.clearAllLocalWishlists();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, isUserLoading, user, local]);

  const isWishlistLoading =
    isAuthenticated && !isUserLoading && user?.id ? isServerLoading : false;
  const isWishlistUpdating =
    isAuthenticated && !isUserLoading && user?.id
      ? addMutation.isPending ||
        removeMutation.isPending ||
        wishlistQueue.size > 0 ||
        wishlistQueue.pending > 0
      : false;

  return {
    wishlistData,
    isWishlistLoading,
    isWishlistUpdating,
    isDomainWishlisted,
    isDomainBusy,
    busy,
    local,
    addMutation,
    removeMutation,
    queryClient,
    WishlistKey,
  };
}

/* -------------------------------------------------------------------------- */
/*                             WISHLIST OPERATIONS                            */
/* -------------------------------------------------------------------------- */

/**
 * Hook for exposing wishlist operations (add, remove, clear)
 */
export function useWishlistOperations(
  sync: ReturnType<typeof useWishlistServerSync>,
) {
  const { isAuthenticated, isLoading: isUserLoading, user } = useAuth();

  const addItem = useCallback(
    async (
      domains: NamefiNormalizedDomain | NamefiNormalizedDomain[],
    ): Promise<UnifiedWishlistItem[]> => {
      const list = Array.isArray(domains) ? domains : [domains];
      if (!list.length) return [];
      const payload: ServerWriteWishlistItem[] = [];
      const touchedDomains: string[] = [];
      const userId = !isUserLoading && user?.id ? user.id : GUEST_USER_ID;
      try {
        list.forEach((d) => {
          if (sync.isDomainWishlisted(d)) return;
          if (sync.isDomainBusy(d)) return;
          sync.busy.markBusy(wishlistDomainKey(userId, d));
          touchedDomains.push(d);
          payload.push({ normalizedDomainName: d, isWishlisted: true });
        });
        if (!payload.length) return [];
        const task = async (): Promise<UnifiedWishlistItem[]> => {
          try {
            if (isAuthenticated && !isUserLoading && user?.id) {
              const server = await sync.addMutation.mutateAsync(payload);
              return normalizeWishlistItems(server, true, user.id);
            }
            const locals = payload.map((p) => markOptimistic(p, GUEST_USER_ID));
            sync.local.addLocalItems(locals);
            return normalizeWishlistItems(
              locals.map(stripForLocalStorage),
              false,
              undefined,
            );
          } finally {
            payload.forEach((p) => {
              sync.busy.clearBusy(
                wishlistDomainKey(userId, p.normalizedDomainName),
              );
            });
          }
        };
        return wishlistQueue.add(task) as Promise<UnifiedWishlistItem[]>;
      } catch (error) {
        touchedDomains.forEach((d) =>
          sync.busy.clearBusy(wishlistDomainKey(userId, d)),
        );
        throw error;
      }
    },
    [sync, isAuthenticated, isUserLoading, user?.id],
  );

  const removeItem = useCallback(
    async (
      domains: NamefiNormalizedDomain | NamefiNormalizedDomain[],
    ): Promise<UnifiedWishlistItem[]> => {
      const list = Array.isArray(domains) ? domains : [domains];
      if (!list.length) return [];
      const userId = !isUserLoading && user?.id ? user.id : GUEST_USER_ID;
      // Enqueue the optimistic update before awaiting onIdle to reduce latency
      const task = async (): Promise<UnifiedWishlistItem[]> => {
        try {
          if (isAuthenticated && !isUserLoading && user?.id) {
            const itemsToRemove =
              sync.wishlistData?.filter((item) =>
                list.includes(item.normalizedDomainName),
              ) ?? [];
            itemsToRemove.forEach((item) => {
              if (item.id) {
                sync.busy.markBusy(item.id);
                sync.queryClient.setQueryData(
                  sync.WishlistKey,
                  (old: UnifiedWishlistItem[] = []) =>
                    old.map((i) =>
                      i.id === item.id ? { ...i, [PENDING_DELETE]: true } : i,
                    ),
                );
              }
            });
            try {
              const removePayload: ServerWriteWishlistItem[] = list.map(
                (d) => ({ normalizedDomainName: d, isWishlisted: false }),
              );
              const removed =
                await sync.removeMutation.mutateAsync(removePayload);
              return normalizeWishlistItems(removed, true, user.id);
            } finally {
              itemsToRemove.forEach((item) => {
                if (item.id) sync.busy.clearBusy(item.id);
              });
            }
          }
          const removedLocal = sync.local.removeLocalByDomain(list);
          return normalizeWishlistItems(removedLocal, false, undefined);
        } finally {
          list.forEach((domain) =>
            sync.busy.clearBusy(wishlistDomainKey(userId, domain)),
          );
        }
      };
      return wishlistQueue.add(task) as Promise<UnifiedWishlistItem[]>;
    },
    [sync, isAuthenticated, isUserLoading, user?.id],
  );

  return {
    addItem,
    removeItem,
  };
}

/* -------------------------------------------------------------------------- */
/*                               FACADE HOOK                                 */
/* -------------------------------------------------------------------------- */

/**
 * Facade hook for wishlist state and operations
 */
export function useWishlist() {
  const sync = useWishlistServerSync();
  const ops = useWishlistOperations(sync);

  const refetchWishlist = useCallback(
    () =>
      sync.queryClient.invalidateQueries({
        queryKey: sync.WishlistKey,
        exact: true,
      }),
    [sync.queryClient, sync.WishlistKey],
  );

  return {
    wishlistData: sync.wishlistData,
    isWishlistLoading: sync.isWishlistLoading,
    isWishlistUpdating: sync.isWishlistUpdating,
    isDomainWishlisted: sync.isDomainWishlisted,
    isDomainBusy: sync.isDomainBusy,
    busy: sync.busy,
    addItem: ops.addItem,
    removeItem: ops.removeItem,
    clearLocalWishlist: sync.local.clearLocalWishlist,
    refetchWishlist,
  };
}

export type UseWishlist = ReturnType<typeof useWishlist>;
