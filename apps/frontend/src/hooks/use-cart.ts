'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from 'usehooks-ts';
import PQueue from 'p-queue';
import { useAuth } from '@/hooks/use-auth';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useTRPC, type AppRouterInput, type AppRouterOutput } from '@/lib/trpc';
import {
  isDomainImportable,
  isDomainRegistrable,
  getDomainPricingForOperation,
  type DomainAvailabilityInfo,
} from '@namefi-astra/backend/trpc/types';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useDebounceCallback } from 'usehooks-ts';
import { LocalStorageKeys } from '@/lib/local-storage-keys';

/* -------------------------------------------------------------------------- */
/*                         SHARED QUEUE AND TYPES                            */
/* -------------------------------------------------------------------------- */

export const cartQueue = new PQueue({ concurrency: 1 });

const OPTIMISTIC = '__optimistic' as const;
const PENDING_DELETE = '__pendingDelete' as const;
export const cartDomainKey = (userId: string, domain: string) =>
  `${userId}:${domain}`;

export type ServerReadCartItem = AppRouterOutput['carts']['getItems'][number];
export type ServerWriteCartItem = AppRouterInput['carts']['addItems'][number];
export type ServerUpdateCartItem = AppRouterInput['carts']['updateItem'];

interface LocalExtras {
  eppAuthorizationCode?: string;
}

type PendingDeleteTag = { [PENDING_DELETE]: true };
type OptimisticTag = { [OPTIMISTIC]: true };

export type UnifiedCartItem = ServerReadCartItem &
  Partial<LocalExtras> &
  Partial<PendingDeleteTag>;

export type AddToCartParams = {
  domainAvailabilityInfo: DomainAvailabilityInfo;
  durationInYears: number;
  operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
  eppAuthorizationCode?: string;
};

export type UpdateItemParams = {
  id: string;
  domainAvailabilityInfo: DomainAvailabilityInfo;
} & (
  | { durationInYears: number; eppAuthorizationCode?: string }
  | { eppAuthorizationCode: string; durationInYears?: number }
);

type Optimistic<T> = T & OptimisticTag;
type MaybeOptimistic<T> = T & Partial<OptimisticTag>;
type MaybeOptimisticUnifiedCartItem = MaybeOptimistic<UnifiedCartItem>;
type OptimisticUnifiedCartItem = Optimistic<UnifiedCartItem>;

const markOptimistic = (
  i: ServerWriteCartItem,
  userId: string,
): OptimisticUnifiedCartItem => ({
  ...i,
  id: deterministicCartId(i.normalizedDomainName, userId),
  normalizedDomainName: i.normalizedDomainName as NamefiNormalizedDomain,
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  encryptionKeyId: 'local-encryption-key',
  encryptedEppAuthorizationCode: 'local-encrypted-epp-authorization-code',
  metadata: {},
  [OPTIMISTIC]: true,
});

const isOptimistic = (i: unknown): i is OptimisticTag =>
  Boolean(i && typeof i === 'object' && OPTIMISTIC in i);

export function isPendingDelete(
  row: UnifiedCartItem | PendingDeleteTag | undefined,
): row is PendingDeleteTag {
  return !!row && typeof row === 'object' && PENDING_DELETE in row;
}

const stripOptimistic = <T extends object>(i: MaybeOptimistic<T>) => {
  const { [OPTIMISTIC]: _, ...rest } = i;
  return rest as T;
};

const stripForLocalStorage = <T extends MaybeOptimisticUnifiedCartItem>(
  i: T,
) => {
  const stripped = stripOptimistic(i);
  return {
    ...stripped,
    encryptionKeyId: null,
    encryptedEppAuthorizationCode: null,
  };
};

/**
 * Helper function to convert CartItem array to InteractionLoggingCartItem array
 */
export function cartItemsToInteractionLoggingCartItems(
  items: UnifiedCartItem[],
) {
  return items.map((item) => ({
    amountInUSDCents: item.amountInUSDCents,
    normalizedDomainName: item.normalizedDomainName,
  }));
}

// --- DETERMINISTIC ID UTILS (copied from wishlist) ---
export const deterministicCartId = (
  domain: string,
  userId: string = GUEST_USER_ID,
) =>
  'c_' +
  btoa(encodeURIComponent(`${userId}:${domain}`))
    .replace(/=+$/, '') // drop padding
    .replace(/\+/g, '-') // URL‑safe
    .replace(/\//g, '_'); // ─┘

export const GUEST_USER_ID = 'guest';

function getCartLocalStorageKey(userId: string | undefined = GUEST_USER_ID) {
  return `${LocalStorageKeys.ANONYMOUS_CART}:${userId}`;
}

/* -------------------------------------------------------------------------- */
/*                             BUSY STATE HOOK                               */
/* -------------------------------------------------------------------------- */

export function useCartBusy() {
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

  useEffect(() => () => dispatchBusy({ type: 'clearAll' }), []);

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

export function useCartLocal() {
  const { user, isLoading: isUserLoading } = useAuth();
  const localStorageKey = useMemo(
    () =>
      getCartLocalStorageKey(!isUserLoading && user?.id ? user.id : undefined),
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
    (item: UnifiedCartItem) => ({
      ...item,
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
    }),
    [],
  );

  const [localCart, setLocalCart, clearLocalCartRaw] = useLocalStorage<
    UnifiedCartItem[]
  >(localStorageKey, [], {
    initializeWithValue: true,
    serializer: (value: UnifiedCartItem[]) =>
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
  const clearAllLocalCarts = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(getCartLocalStorageKey(GUEST_USER_ID));
        if (user?.id) {
          window.localStorage.removeItem(getCartLocalStorageKey(user.id));
        }
      } catch (err) {
        console.error('Failed to clear local cart', err);
      }
    }
  }, [user?.id]);

  // Helper to clear only the current key
  const clearLocalCart = useCallback(() => {
    clearLocalCartRaw();
  }, [clearLocalCartRaw]);

  const addLocalItems = useCallback(
    (items: UnifiedCartItem[]) => {
      setLocalCart((prev) => [...prev, ...items.map(stripForLocalStorage)]);
    },
    [setLocalCart],
  );

  const updateLocalItem = useCallback(
    (updatePayload: ServerUpdateCartItem): UnifiedCartItem => {
      const existingItem = localCart.find((i) => i.id === updatePayload.id);
      if (!existingItem) {
        throw new Error('Cart item not found in local storage');
      }
      const updatedItem = {
        ...stripOptimistic(existingItem),
        ...updatePayload,
      };
      setLocalCart((prev) =>
        prev.map((i) => (i.id === updatePayload.id ? updatedItem : i)),
      );
      return updatedItem;
    },
    [localCart, setLocalCart],
  );

  const removeLocalByDomain = useCallback(
    (domains: NamefiNormalizedDomain[]) => {
      const removedLocal = localCart.filter((i) =>
        domains.includes(i.normalizedDomainName),
      );
      setLocalCart((prev) =>
        prev.filter((i) => !domains.includes(i.normalizedDomainName)),
      );
      return removedLocal;
    },
    [localCart, setLocalCart],
  );

  return useMemo(
    () => ({
      localCart,
      addLocalItems,
      updateLocalItem,
      removeLocalByDomain,
      clearLocalCart,
      clearAllLocalCarts,
    }),
    [
      localCart,
      addLocalItems,
      updateLocalItem,
      removeLocalByDomain,
      clearLocalCart,
      clearAllLocalCarts,
    ],
  );
}

/* -------------------------------------------------------------------------- */
/*                           SERVER SYNC HOOK                                */
/* -------------------------------------------------------------------------- */

export function useCartServerSync() {
  const trpc = useTRPC();
  const { isAuthenticated, isLoading: isUserLoading, user } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const queryClient = useQueryClient();
  const busy = useCartBusy();
  const local = useCartLocal();

  const CartKey = useMemo(() => trpc.carts.getItems.queryKey(), [trpc]);

  /* ------------------------- debounce invalidate ------------------------- */
  const debouncedInvalidate = useDebounceCallback(() => {
    queryClient.invalidateQueries({
      queryKey: CartKey,
      refetchType: 'inactive',
      exact: true,
    });
  }, 300);

  useEffect(() => debouncedInvalidate.cancel, [debouncedInvalidate]);

  /* ------------------------------ rollback ------------------------------- */
  const rollback = useCallback(
    (ctx?: { prev?: UnifiedCartItem[] }) => {
      if (!ctx?.prev) return;
      queryClient.setQueryData(CartKey, ctx.prev.map(stripOptimistic));
      debouncedInvalidate();
    },
    [debouncedInvalidate, queryClient, CartKey],
  );

  /* ------------------------------ normalize ------------------------------- */
  const normalize = useCallback(
    (items: (ServerReadCartItem | UnifiedCartItem)[]): UnifiedCartItem[] =>
      items.map((item) => {
        const effectiveUserId =
          item.userId ??
          (isAuthenticated && !isUserLoading && user?.id
            ? user.id
            : GUEST_USER_ID);
        const id =
          item.id ??
          deterministicCartId(item.normalizedDomainName, effectiveUserId);
        return {
          ...stripOptimistic(item),
          id,
          userId: effectiveUserId,
          encryptionKeyId: item.encryptionKeyId ?? null,
          encryptedEppAuthorizationCode:
            item.encryptedEppAuthorizationCode ?? null,
        };
      }),
    [isAuthenticated, isUserLoading, user?.id],
  );

  const mergeByDomain = (
    delta: UnifiedCartItem[],
    base: UnifiedCartItem[] = [],
  ) => {
    const map = new Map(base.map((i) => [i.normalizedDomainName, i]));
    delta.forEach((i) => map.set(i.normalizedDomainName, i));
    return [...map.values()];
  };

  /* ------------------------------ query ---------------------------------- */
  useEffect(() => {
    queryClient.setQueryDefaults(CartKey, {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      meta: { abortOnUnmount: true },
    });
  }, [queryClient, CartKey]);

  const { data: serverData, isLoading: isServerLoading } = useQuery({
    ...trpc.carts.getItems.queryOptions(),
    enabled: isAuthenticated,
  });

  const cartData = useMemo(() => {
    const src = isAuthenticated ? serverData : local.localCart;
    if (!src) return undefined;
    return normalize(
      src
        .slice()
        .sort(
          (a, b) =>
            (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
        ),
    );
  }, [isAuthenticated, serverData, local.localCart, normalize]);

  const isDomainInCart = useCallback(
    (d: string) => cartData?.some((i) => i.normalizedDomainName === d) ?? false,
    [cartData],
  );

  const isDomainBusy = useCallback(
    (domain: string) => {
      const currentUserId = user?.id ?? GUEST_USER_ID;
      if (busy.isBusy(cartDomainKey(currentUserId, domain))) return true;
      const maybeIds =
        cartData
          ?.filter((i) => i.normalizedDomainName === domain)
          .map((i) => i.id) ?? [];

      return maybeIds.some((id) => id && busy.isBusy(id));
    },
    [busy, cartData, user?.id],
  );

  /* ------------------------------ mutations ------------------------------ */
  const cartRetryPolicy = (failCount: number, err: any) => {
    const status = err?.data?.httpStatus;
    return (status === undefined || status >= 500) && failCount < 3;
  };

  const addMutation = useMutation({
    ...trpc.carts.addItems.mutationOptions({ retry: cartRetryPolicy }),
    onMutate: async (payload: ServerWriteCartItem[]) => {
      await queryClient.cancelQueries({ queryKey: CartKey, exact: true });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey) ?? [];
      const optimistic = normalize(
        payload.map((p) => ({
          ...markOptimistic(p, user?.id ?? GUEST_USER_ID),
          id: deterministicCartId(
            p.normalizedDomainName,
            user?.id ?? GUEST_USER_ID,
          ),
        })),
      );
      queryClient.setQueryData(CartKey, mergeByDomain(optimistic, prev));
      const touched = payload.map((p) =>
        cartDomainKey(user?.id ?? GUEST_USER_ID, p.normalizedDomainName),
      );
      return { prev, keys: touched };
    },
    onError: (_e, _v, ctx) => {
      rollback(ctx);
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSuccess: (server, _vars, ctx) => {
      const authoritative = normalize(server);
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) => {
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
      });
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSettled: debouncedInvalidate,
  });

  const removeMutation = useMutation({
    ...trpc.carts.removeItem.mutationOptions({ retry: cartRetryPolicy }),
    onMutate: async (domains: NamefiNormalizedDomain[]) => {
      const touchedIds: string[] = [];
      cartData?.forEach((item) => {
        if (domains.includes(item.normalizedDomainName) && item.id) {
          busy.markBusy(item.id);
          touchedIds.push(item.id);
        }
      });
      await queryClient.cancelQueries({ queryKey: CartKey, exact: true });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey);
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) =>
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
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) => {
        return old.filter(
          (i) => !(removedSet.has(i.normalizedDomainName) && !isOptimistic(i)),
        );
      });
      ctx?.keys?.forEach(busy.clearBusy);
    },
    onSettled: debouncedInvalidate,
  });

  const clearMutation = useMutation({
    mutationFn: trpc.carts.clear.mutationOptions().mutationFn,
    retry: cartRetryPolicy,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CartKey, exact: true });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey);
      queryClient.setQueryData(CartKey, []);
      return { prev };
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: debouncedInvalidate,
  });

  const updateMutation = useMutation({
    ...trpc.carts.updateItem.mutationOptions({ retry: cartRetryPolicy }),
    onMutate: async (payload: ServerUpdateCartItem) => {
      await queryClient.cancelQueries({ queryKey: CartKey, exact: true });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey) ?? [];
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) =>
        old.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                ...payload,
                [OPTIMISTIC]: true,
              }
            : item,
        ),
      );
      return { prev, id: payload.id };
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSuccess: (serverItems, _vars, ctx) => {
      const authoritative = normalize(serverItems)[0];
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) =>
        old.map((i) => {
          if (i.id === ctx?.id && isOptimistic(i)) {
            if (authoritative.updatedAt >= i.updatedAt) {
              return authoritative;
            }
          }
          return i;
        }),
      );
    },
    onSettled: debouncedInvalidate,
  });

  /* -------------------------- sync local on login ------------------------ */
  const syncing = useRef(false);
  useEffect(() => {
    if (
      !isAuthenticated ||
      isUserLoading ||
      !user?.id ||
      !local.localCart.length ||
      syncing.current
    )
      return;
    syncing.current = true;

    const syncTask = async () => {
      try {
        const writes: ServerWriteCartItem[] = local.localCart.map((i) => ({
          normalizedDomainName: i.normalizedDomainName,
          amountInUSDCents: i.amountInUSDCents,
          durationInYears: i.durationInYears,
          type: i.type,
          // TODO: (Sid->Sami) - make registrar required
          registrar: i.registrar ?? 'namefi',
          eppAuthorizationCode: i.eppAuthorizationCode,
        }));
        if (writes.length) {
          await addMutation.mutateAsync(writes);
        }
        local.clearAllLocalCarts();
      } finally {
        syncing.current = false;
      }
    };
    cartQueue.add(syncTask);
    return () => {
      syncing.current = false;
    };
  }, [
    isAuthenticated,
    isUserLoading,
    user,
    local.localCart,
    local.clearAllLocalCarts,
    addMutation,
  ]);

  /* ---------------------------- state flags ------------------------------ */
  const isCartLoading =
    isAuthenticated && !isUserLoading && user?.id ? isServerLoading : false;
  const isCartUpdating =
    isAuthenticated && !isUserLoading && user?.id
      ? addMutation.isPending ||
        removeMutation.isPending ||
        clearMutation.isPending ||
        updateMutation.isPending ||
        cartQueue.size > 0 ||
        cartQueue.pending > 0
      : false;

  return {
    cartData,
    isCartLoading,
    isCartUpdating,
    isDomainInCart,
    isDomainBusy,
    normalize,
    busy,
    local,
    addMutation,
    removeMutation,
    updateMutation,
    clearMutation,
    queryClient,
    CartKey,
    buildServerWriteCartItem: useCallback(
      (p: AddToCartParams): ServerWriteCartItem => {
        const {
          domainAvailabilityInfo: info,
          durationInYears,
          operationType,
          eppAuthorizationCode,
        } = p;
        if (
          operationType === itemTypeSchema.Values.IMPORT &&
          !isDomainImportable(info)
        )
          throw new Error('Domain is not importable');
        if (
          operationType === itemTypeSchema.Values.REGISTER &&
          !isDomainRegistrable(info)
        )
          throw new Error('Domain is not registrable');
        const pricing = getDomainPricingForOperation(info, operationType);
        if (!pricing) throw new Error('Pricing unavailable');
        return {
          normalizedDomainName: info.domain,
          amountInUSDCents: usdToCents(
            computeChargesInUsdOrThrow(pricing, durationInYears),
          ),
          durationInYears,
          type: operationType,
          registrar: info.registrarKey || 'namefi',
          eppAuthorizationCode:
            operationType === itemTypeSchema.Values.IMPORT
              ? eppAuthorizationCode
              : undefined,
        };
      },
      [],
    ),
    buildServerUpdateCartItem: useCallback(
      (p: UpdateItemParams): ServerUpdateCartItem => {
        const payload: ServerUpdateCartItem = {
          id: p.id,
        };
        if (p.durationInYears !== undefined) {
          payload.durationInYears = p.durationInYears;
        }
        if (p.eppAuthorizationCode !== undefined) {
          payload.eppAuthorizationCode = p.eppAuthorizationCode;
        }
        return payload;
      },
      [],
    ),
    calculateOptimisticPrice: useCallback(
      (p: UpdateItemParams): number | undefined => {
        if (p.durationInYears === undefined) return undefined;
        const existingItem = cartData?.find((i) => i.id === p.id);
        if (!existingItem) {
          throw new Error('Cart item not found');
        }
        if (p.durationInYears === existingItem.durationInYears) {
          return undefined;
        }
        const pricingDetails = getDomainPricingForOperation(
          p.domainAvailabilityInfo,
          existingItem.type,
        );
        if (!pricingDetails) {
          throw new Error(
            `${existingItem.type} pricing details are unavailable`,
          );
        }
        const chargeAmountInUsd = computeChargesInUsdOrThrow(
          pricingDetails,
          p.durationInYears,
        );
        return usdToCents(chargeAmountInUsd);
      },
      [cartData],
    ),
    logEventWithInteractionLoggers,
  };
}

/* -------------------------------------------------------------------------- */
/*                             CART OPERATIONS                               */
/* -------------------------------------------------------------------------- */

export function useCartOperations(sync: ReturnType<typeof useCartServerSync>) {
  const { isAuthenticated, isLoading: isUserLoading, user } = useAuth();
  const userId = user?.id ?? GUEST_USER_ID;

  const addItem = useCallback(
    async (
      raw: AddToCartParams | AddToCartParams[],
    ): Promise<UnifiedCartItem[]> => {
      const params = Array.isArray(raw) ? raw : [raw];
      const payload: ServerWriteCartItem[] = [];
      const touchedDomains: string[] = [];
      try {
        params.forEach((p) => {
          const d = p.domainAvailabilityInfo.domain;
          if (sync.isDomainInCart(d)) return;
          if (sync.isDomainBusy(d)) return;
          sync.busy.markBusy(cartDomainKey(userId, d));
          touchedDomains.push(d);
          try {
            payload.push(sync.buildServerWriteCartItem(p));
          } catch (e) {
            sync.busy.clearBusy(cartDomainKey(userId, d));
            throw e;
          }
        });
        if (!payload.length) return [];
        const task = async (): Promise<UnifiedCartItem[]> => {
          try {
            if (isAuthenticated && !isUserLoading && userId !== GUEST_USER_ID) {
              const server = await sync.addMutation.mutateAsync(payload);
              const unified = sync.normalize(server);
              if (unified.length) {
                unified.forEach((item) => {
                  sync.logEventWithInteractionLoggers({
                    name: InteractionLoggingEventName.AddToCart,
                    properties: {
                      cartItem: {
                        amountInUSDCents: item.amountInUSDCents,
                        normalizedDomainName: item.normalizedDomainName,
                      },
                    },
                  });
                });
              }
              return unified;
            }
            const locals = payload.map((p) => ({
              ...markOptimistic(p, userId),
              id: deterministicCartId(p.normalizedDomainName, userId),
              eppAuthorizationCode: p.eppAuthorizationCode,
            }));
            sync.local.addLocalItems(locals);
            return sync.normalize(locals.map(stripForLocalStorage));
          } finally {
            payload.forEach((p) => {
              sync.busy.clearBusy(
                cartDomainKey(userId, p.normalizedDomainName),
              );
            });
          }
        };
        return cartQueue.add(task) as Promise<UnifiedCartItem[]>;
      } catch (error) {
        touchedDomains.forEach((d) =>
          sync.busy.clearBusy(cartDomainKey(userId, d)),
        );
        throw error;
      }
    },
    [sync, isAuthenticated, isUserLoading, userId],
  );

  const removeItem = useCallback(
    async (
      d: NamefiNormalizedDomain | NamefiNormalizedDomain[],
    ): Promise<UnifiedCartItem[]> => {
      const list = Array.isArray(d) ? d : [d];
      if (!list.length) return [];
      const task = async (): Promise<UnifiedCartItem[]> => {
        try {
          if (isAuthenticated && !isUserLoading && userId !== GUEST_USER_ID) {
            const itemsToRemove =
              sync.cartData?.filter((item) =>
                list.includes(item.normalizedDomainName),
              ) ?? [];
            itemsToRemove.forEach((item) => {
              if (item.id) {
                sync.busy.markBusy(item.id);
                sync.queryClient.setQueryData(
                  sync.CartKey,
                  (old: UnifiedCartItem[] = []) =>
                    old.map((i) =>
                      i.id === item.id ? { ...i, [PENDING_DELETE]: true } : i,
                    ),
                );
              }
            });
            try {
              const removed = await sync.removeMutation.mutateAsync(list);
              if (removed.length) {
                removed.forEach((item) => {
                  sync.logEventWithInteractionLoggers({
                    name: InteractionLoggingEventName.RemoveFromCart,
                    properties: {
                      cartItem: {
                        amountInUSDCents: item.amountInUSDCents,
                        normalizedDomainName: item.normalizedDomainName,
                      },
                    },
                  });
                });
              }
              return sync.normalize(removed);
            } finally {
              itemsToRemove.forEach((item) => {
                if (item.id) sync.busy.clearBusy(item.id);
              });
            }
          }
          const removedLocal = sync.local.removeLocalByDomain(list);
          if (removedLocal.length) {
            removedLocal.forEach((item) => {
              sync.logEventWithInteractionLoggers({
                name: InteractionLoggingEventName.RemoveFromCart,
                properties: {
                  cartItem: {
                    amountInUSDCents: item.amountInUSDCents,
                    normalizedDomainName: item.normalizedDomainName,
                  },
                },
              });
            });
          }
          return sync.normalize(removedLocal);
        } finally {
          list.forEach((domain) =>
            sync.busy.clearBusy(cartDomainKey(userId, domain)),
          );
        }
      };
      return cartQueue.add(task) as Promise<UnifiedCartItem[]>;
    },
    [sync, isAuthenticated, isUserLoading, userId],
  );

  const updateItem = useCallback(
    async (input: UpdateItemParams): Promise<UnifiedCartItem> => {
      sync.busy.markBusy(input.id);

      const task = async (): Promise<UnifiedCartItem> => {
        try {
          if (isAuthenticated && !isUserLoading && user?.id) {
            const updatePayload = sync.buildServerUpdateCartItem(input);
            const optimisticPrice = sync.calculateOptimisticPrice(input);

            if (optimisticPrice !== undefined) {
              await sync.queryClient.cancelQueries({ queryKey: sync.CartKey });

              sync.queryClient.setQueryData(
                sync.CartKey,
                (old: UnifiedCartItem[] = []) =>
                  old.map((item) =>
                    item.id === input.id
                      ? {
                          ...item,
                          amountInUSDCents: optimisticPrice,
                          ...(input.durationInYears !== undefined && {
                            durationInYears: input.durationInYears,
                          }),
                          ...(input.eppAuthorizationCode !== undefined && {
                            eppAuthorizationCode: input.eppAuthorizationCode,
                          }),
                          [OPTIMISTIC]: true,
                        }
                      : item,
                  ),
              );
            }

            const serverResults =
              await sync.updateMutation.mutateAsync(updatePayload);
            const normalizedResults = sync.normalize(serverResults);
            return normalizedResults[0];
          }

          const updatePayload = sync.buildServerUpdateCartItem(input);
          const optimisticPrice = sync.calculateOptimisticPrice(input);

          const localUpdatePayload = {
            ...updatePayload,
            ...(optimisticPrice !== undefined && {
              amountInUSDCents: optimisticPrice,
            }),
            ...(input.eppAuthorizationCode !== undefined && {
              eppAuthorizationCode: input.eppAuthorizationCode,
            }),
          };

          return sync.local.updateLocalItem(
            stripOptimistic(localUpdatePayload),
          );
        } finally {
          sync.busy.clearBusy(input.id);
        }
      };

      try {
        const result = await cartQueue.add(task);
        if (!result) throw new Error('Cart update failed');
        return result;
      } catch (err) {
        sync.busy.clearBusy(input.id);
        throw err;
      }
    },
    [sync, isAuthenticated, isUserLoading, user?.id],
  );

  const clearCart = useCallback(async () => {
    const task = async () => {
      if (isAuthenticated && !isUserLoading && user?.id) {
        await sync.clearMutation.mutateAsync();
      } else {
        sync.local.clearAllLocalCarts();
      }
      return [] as UnifiedCartItem[];
    };

    return cartQueue.add(task) as Promise<UnifiedCartItem[]>;
  }, [isAuthenticated, isUserLoading, user, sync]);

  return {
    addItem,
    removeItem,
    updateItem,
    clearCart,
  };
}

/* -------------------------------------------------------------------------- */
/*                               FACADE HOOK                                 */
/* -------------------------------------------------------------------------- */

export function useCart() {
  const sync = useCartServerSync();
  const ops = useCartOperations(sync);

  const getCartItemId = useCallback(
    (d: string) => sync.cartData?.find((i) => i.normalizedDomainName === d)?.id,
    [sync.cartData],
  );

  const refetchCart = useCallback(
    () =>
      sync.queryClient.invalidateQueries({
        queryKey: sync.CartKey,
        exact: true,
      }),
    [sync.queryClient, sync.CartKey],
  );

  return {
    cartData: sync.cartData,
    isCartLoading: sync.isCartLoading,
    isCartUpdating: sync.isCartUpdating,
    isDomainInCart: sync.isDomainInCart,
    isDomainBusy: sync.isDomainBusy,
    busy: sync.busy,
    getCartItemId,
    addItem: ops.addItem,
    updateItem: ops.updateItem,
    removeItem: ops.removeItem,
    clearCart: ops.clearCart,
    clearLocalCart: sync.local.clearLocalCart,
    refetchCart,
  };
}

export type UseCart = ReturnType<typeof useCart>;
