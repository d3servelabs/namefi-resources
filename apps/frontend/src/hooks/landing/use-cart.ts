import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from 'usehooks-ts';
import { useAuth } from '@/hooks/useAuth';
import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import { InteractionLoggingEventName } from '@/utils/interaction-logging/events';
import {
  useTRPC,
  type AppRouterInput,
  type AppRouterOutput,
} from '@/utils/trpc';
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
import { config } from '@/lib/env';

/* -------------------------------------------------------------------------- */
/*                                TYPE HELPERS                               */
/* -------------------------------------------------------------------------- */

type ServerReadCartItem = AppRouterOutput['carts']['getItems'][number];
type ServerWriteCartItem = AppRouterInput['carts']['addItems'][number];
type ServerUpdateCartItem = AppRouterInput['carts']['updateItem'];
interface LocalExtras {
  eppAuthorizationCode?: string;
}
export type UnifiedCartItem = ServerReadCartItem & Partial<LocalExtras>;
type AddToCartParams = {
  domainAvailabilityInfo: DomainAvailabilityInfo;
  durationInYears: number;
  operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
  eppAuthorizationCode?: string;
};
type AddToCartFunction = (
  items: AddToCartParams | AddToCartParams[],
) => Promise<UnifiedCartItem[]>;
type UpdateItemParams = {
  id: string;
  domainAvailabilityInfo: DomainAvailabilityInfo;
} & (
  | { durationInYears: number; eppAuthorizationCode?: string }
  | { eppAuthorizationCode: string; durationInYears?: number }
);
type UpdateItemFunction = (item: UpdateItemParams) => Promise<UnifiedCartItem>;
/* -------------------------------------------------------------------------- */
/*                               UTIL CONSTANTS                               */
/* -------------------------------------------------------------------------- */

const OPT = '__optimistic' as const;

type OptimisticTag = { [OPT]: true };
type Optimistic<T> = T & OptimisticTag;
type MaybeOptimistic<T> = T & Partial<OptimisticTag>;
type MaybeOptimisticUnifiedCartItem = MaybeOptimistic<UnifiedCartItem>;
type OptimisticUnifiedCartItem = Optimistic<UnifiedCartItem>;

const markOptimistic = (
  i: ServerWriteCartItem,
  userId: string,
): OptimisticUnifiedCartItem => ({
  ...i,
  id: crypto.randomUUID(),
  normalizedDomainName: i.normalizedDomainName as NamefiNormalizedDomain,
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  encryptionKeyId: 'local-encryption-key',
  encryptedEppAuthorizationCode: 'local-encrypted-epp-authorization-code',
  metadata: {},
  [OPT]: true,
});

const isOptimistic = (i: any): i is OptimisticTag =>
  i && typeof i === 'object' && OPT in i;

const stripOptimistic = <T extends object>(i: MaybeOptimistic<T>) => {
  const { [OPT]: _, ...rest } = i;
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

/* -------------------------------------------------------------------------- */
/*                              BUSY STATE REDUCER                           */
/* -------------------------------------------------------------------------- */

type BusyKey = string; // usually the cart-item id
type BusyAction =
  | { type: 'mark'; key: BusyKey }
  | { type: 'clear'; key: BusyKey }
  | { type: 'clearAll' };

function busyReducer(state: Set<BusyKey>, action: BusyAction): Set<BusyKey> {
  switch (action.type) {
    case 'mark': {
      if (state.has(action.key)) return state;
      const next = new Set(state);
      next.add(action.key);
      return next;
    }
    case 'clear': {
      if (!state.has(action.key)) return state;
      const next = new Set(state);
      next.delete(action.key);
      return next;
    }
    case 'clearAll':
      return new Set();
  }
}

const domainKey = (domain: string) => `domain:${domain}`;

/* -------------------------------------------------------------------------- */
/*                                 HOOK BODY                                  */
/* -------------------------------------------------------------------------- */

export function useCart() {
  const trpc = useTRPC();
  const { isAuthenticated, user } = useAuth();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const queryClient = useQueryClient();

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

  const safeInvalidate = useCallback(() => {
    debouncedInvalidate();
  }, [debouncedInvalidate]);

  /* ------------------------------ rollback ------------------------------- */
  const rollback = useCallback(
    (ctx?: { prev?: UnifiedCartItem[] }) => {
      if (!ctx?.prev) return;
      queryClient.setQueryData(CartKey, ctx.prev.map(stripOptimistic));
      safeInvalidate();
    },
    [safeInvalidate, queryClient, CartKey],
  );

  /* ---------------------------- local storage ---------------------------- */
  const reviveDates = (item: any) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  });

  const [localCart, setLocalCart, clearLocalCart] = useLocalStorage<
    UnifiedCartItem[]
  >('user-cart-items', [], {
    initializeWithValue: true,
    deserializer: (value: string) => {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(reviveDates) : [];
    },
  });

  /* ------------------------------ helpers ------------------------------- */
  const normalize = useCallback(
    (items: (ServerReadCartItem | UnifiedCartItem)[]): UnifiedCartItem[] =>
      items.map((item) => {
        if (!item.id && config.TYPE !== 'production') {
          console.error('Cart item without ID', item);
        }

        return {
          ...stripOptimistic(item),
          id: item.id ?? crypto.randomUUID(),
          userId: item.userId ?? 'anonymous',
          encryptionKeyId: item.encryptionKeyId ?? null,
          encryptedEppAuthorizationCode:
            item.encryptedEppAuthorizationCode ?? null,
        };
      }),
    [],
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
    const src = isAuthenticated ? serverData : localCart;
    if (!src) return undefined;
    return normalize(
      src
        .slice()
        .sort(
          (a, b) =>
            (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
        ),
    );
  }, [isAuthenticated, serverData, localCart, normalize]);

  /* ------------------------ optimistic helpers --------------------------- */
  // Removed pendingAdds ref - no longer needed with busyIds
  const addPromiseRef = useRef<Promise<any> | null>(null);

  /* ----------------------- busy-flag reducer (id-based) -------------------- */
  const [busyIds, dispatchBusy] = useReducer(busyReducer, new Set<BusyKey>());

  const markBusy = useCallback(
    (key: BusyKey) => dispatchBusy({ type: 'mark', key }),
    [],
  );
  const clearBusy = useCallback(
    (key: BusyKey) => dispatchBusy({ type: 'clear', key }),
    [],
  );

  const isDomainInCart = useCallback(
    (d: string) => cartData?.some((i) => i.normalizedDomainName === d) ?? false,
    [cartData],
  );

  /* ------------------------------ mutations ------------------------------ */

  const addMutation = useMutation({
    ...trpc.carts.addItems.mutationOptions(),
    onMutate: async (payload: ServerWriteCartItem[]) => {
      await queryClient.cancelQueries({ queryKey: CartKey });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey) ?? [];
      const optimistic = normalize(
        payload.map((p) => markOptimistic(p, user?.id ?? 'anonymous')),
      );
      queryClient.setQueryData(CartKey, mergeByDomain(optimistic, prev));
      const touched = payload.map((p) => domainKey(p.normalizedDomainName));
      return { prev, keys: touched };
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSuccess: (server) => {
      const authoritative = normalize(server);
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) => {
        const map = new Map(old.map((i) => [i.normalizedDomainName, i]));
        authoritative.forEach((s) => {
          const existing = map.get(s.normalizedDomainName);
          if (existing && isOptimistic(existing))
            map.set(s.normalizedDomainName, s);
        });
        return [...map.values()];
      });
      // Clear the domain placeholder keys on success
      server.forEach((i) => clearBusy(domainKey(i.normalizedDomainName)));
    },
    onSettled: (_d, _e, _v, ctx) => {
      // If the mutation threw an error, clear its busy placeholders
      ctx?.keys?.forEach(clearBusy);
      safeInvalidate();
    },
  });

  const runAdd = useCallback(
    (payload: ServerWriteCartItem[]) => {
      // If it's already running, return the existing promise
      if (addPromiseRef.current) return addPromiseRef.current;

      addPromiseRef.current = addMutation
        .mutateAsync(payload)
        .then((r) => {
          addPromiseRef.current = null;
          return r;
        })
        .catch((e) => {
          addPromiseRef.current = null;
          throw e;
        });

      return addPromiseRef.current;
    },
    [addMutation],
  );

  const removeMutation = useMutation({
    ...trpc.carts.removeItem.mutationOptions(),
    onMutate: async (domains: NamefiNormalizedDomain[]) => {
      // Mark existing items as busy by their IDs and collect them
      const touchedIds: string[] = [];
      cartData?.forEach((item) => {
        if (domains.includes(item.normalizedDomainName) && item.id) {
          markBusy(item.id);
          touchedIds.push(item.id);
        }
      });
      await queryClient.cancelQueries({ queryKey: CartKey });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey);
      // Filter out items by ID to prevent update collisions
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) =>
        old.filter((c) => !touchedIds.includes(c.id)),
      );
      return { prev, keys: touchedIds };
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSuccess: (removed) => {
      const removedSet = new Set(removed.map((i) => i.normalizedDomainName));
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) => {
        // skip if re‑added optimistically
        return old.filter(
          (i) => !(removedSet.has(i.normalizedDomainName) && !isOptimistic(i)),
        );
      });
    },
    onSettled: (_d, _e, _v, ctx) => {
      // Only clear the specific IDs this mutation touched
      ctx?.keys?.forEach(clearBusy);
      safeInvalidate();
    },
  });

  const clearMutation = useMutation({
    mutationFn: trpc.carts.clear.mutationOptions().mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CartKey });
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey);
      queryClient.setQueryData(CartKey, []);
      return { prev };
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSettled: safeInvalidate,
  });

  /* ------------------------------ updateItem ----------------------------- */
  const buildServerUpdateCartItem = (
    p: UpdateItemParams,
  ): ServerUpdateCartItem => {
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
  };

  const calculateOptimisticPrice = (
    p: UpdateItemParams,
  ): number | undefined => {
    if (p.durationInYears === undefined) return undefined;

    // Find the existing cart item to get current type
    const existingItem = cartData?.find((i) => i.id === p.id);
    if (!existingItem) {
      throw new Error('Cart item not found');
    }

    // Skip calculation if duration is the same and no EPP code update
    if (
      p.durationInYears === existingItem.durationInYears &&
      p.eppAuthorizationCode === undefined
    ) {
      return undefined; // keep old amount
    }

    // Calculate pricing based on domain info and duration
    const pricingDetails = getDomainPricingForOperation(
      p.domainAvailabilityInfo,
      existingItem.type,
    );

    if (!pricingDetails) {
      throw new Error(`${existingItem.type} pricing details are unavailable`);
    }

    const chargeAmountInUsd = computeChargesInUsdOrThrow(
      pricingDetails,
      p.durationInYears,
    );

    return usdToCents(chargeAmountInUsd);
  };

  const updateMutation = useMutation({
    ...trpc.carts.updateItem.mutationOptions(),
    onMutate: async (payload: ServerUpdateCartItem) => {
      await queryClient.cancelQueries({ queryKey: CartKey });

      // remember previous cache
      const prev = queryClient.getQueryData<UnifiedCartItem[]>(CartKey) ?? [];

      // optimistic patch
      queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) =>
        old.map((item) =>
          item.id === payload.id
            ? {
                ...item,
                ...payload,
                [OPT]: true,
              }
            : item,
        ),
      );

      return { prev, id: payload.id };
    },
    onError: (_e, _v, ctx) => rollback(ctx),
    onSuccess: (serverItems, _vars, ctx) => {
      const authoritative = normalize(serverItems)[0]; // ← server returns `[item]`

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
    onSettled: safeInvalidate,
  });

  const updateItem: UpdateItemFunction = async (input) => {
    markBusy(input.id);

    try {
      if (isAuthenticated) {
        const updatePayload = buildServerUpdateCartItem(input);
        const optimisticPrice = calculateOptimisticPrice(input);

        // If we calculated a price, update the optimistic cache with it
        if (optimisticPrice !== undefined) {
          await queryClient.cancelQueries({ queryKey: CartKey });

          queryClient.setQueryData(CartKey, (old: UnifiedCartItem[] = []) =>
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
                    [OPT]: true,
                  }
                : item,
            ),
          );
        }

        const serverResults = await updateMutation.mutateAsync(updatePayload);
        const normalizedResults = normalize(serverResults);
        return normalizedResults[0];
      }

      const updatePayload = buildServerUpdateCartItem(input);
      const optimisticPrice = calculateOptimisticPrice(input);

      // For local updates, include the calculated price
      const localUpdatePayload = {
        ...updatePayload,
        ...(optimisticPrice !== undefined && {
          amountInUSDCents: optimisticPrice,
        }),
        ...(input.eppAuthorizationCode !== undefined && {
          eppAuthorizationCode: input.eppAuthorizationCode,
        }),
      };

      const updatedItem = applyLocalUpdate(stripOptimistic(localUpdatePayload));
      return updatedItem;
    } finally {
      clearBusy(input.id);
    }
  };

  /* ------------------------------ addItem -------------------------------- */
  const buildServerWriteCartItem = (
    p: AddToCartParams,
  ): ServerWriteCartItem => {
    const {
      domainAvailabilityInfo: info,
      durationInYears,
      operationType,
      eppAuthorizationCode,
    } = p;

    if (operationType === 'IMPORT' && !isDomainImportable(info))
      throw new Error('Domain is not importable');
    if (operationType === 'REGISTER' && !isDomainRegistrable(info))
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
      // TODO: (Sid->Sami) add "namefi" in registar and make it required
      registrar: info.registrarKey || 'namefi',
      eppAuthorizationCode:
        operationType === itemTypeSchema.Values.IMPORT
          ? eppAuthorizationCode
          : undefined,
    };
  };

  const addItem: AddToCartFunction = async (raw) => {
    const params = Array.isArray(raw) ? raw : [raw];
    const payload: ServerWriteCartItem[] = [];

    for (const p of params) {
      const d = p.domainAvailabilityInfo.domain;
      if (isDomainInCart(d)) continue; // already present
      if (isDomainBusy(d) || addPromiseRef.current) continue; // already being processed

      markBusy(domainKey(d));
      try {
        payload.push(buildServerWriteCartItem(p));
      } catch (e) {
        clearBusy(domainKey(d));
        throw e;
      }
    }

    if (!payload.length) return [];

    if (isAuthenticated) {
      const server = await runAdd(payload);
      const unified = normalize(server);
      unified.forEach((c) =>
        logEventWithInteractionLoggers({
          name: InteractionLoggingEventName.AddToCart,
          properties: {
            cartItem: {
              amountInUSDCents: c.amountInUSDCents,
              normalizedDomainName: c.normalizedDomainName,
            },
          },
        }),
      );
      return unified;
    }

    const locals = payload.map((p) => ({
      ...markOptimistic(p, 'anonymous'),
      eppAuthorizationCode: p.eppAuthorizationCode,
    }));
    setLocalCart((prev) => [...prev, ...locals.map(stripForLocalStorage)]);

    // Local add finishes instantly → clear busy flags
    payload.forEach((p) => {
      clearBusy(domainKey(p.normalizedDomainName));
    });

    return normalize(locals.map(stripForLocalStorage));
  };

  /* ----------------------------- removeItem ------------------------------ */
  const removeItem = async (
    d: NamefiNormalizedDomain | NamefiNormalizedDomain[],
  ): Promise<UnifiedCartItem[]> => {
    const list = Array.isArray(d) ? d : [d];
    if (!list.length) return [];

    // Wait for any pending add operations to complete
    while (
      list.some((domain) => isDomainBusy(domain)) &&
      addPromiseRef.current
    ) {
      await addPromiseRef.current;
    }

    if (isAuthenticated) {
      // Mark existing items as busy by their IDs
      const itemsToRemove =
        cartData?.filter((item) => list.includes(item.normalizedDomainName)) ??
        [];
      itemsToRemove.forEach((item) => {
        if (item.id) markBusy(item.id);
      });

      try {
        const removed = await removeMutation.mutateAsync(list);
        removed.forEach((c) =>
          logEventWithInteractionLoggers({
            name: InteractionLoggingEventName.RemoveFromCart,
            properties: {
              cartItem: {
                amountInUSDCents: c.amountInUSDCents,
                normalizedDomainName: c.normalizedDomainName,
              },
            },
          }),
        );
        return normalize(removed);
      } finally {
        // Clear pending state
        itemsToRemove.forEach((item) => {
          if (item.id) clearBusy(item.id);
        });
      }
    }

    const removedLocal = localCart.filter((i) =>
      list.includes(i.normalizedDomainName),
    );
    setLocalCart((prev) =>
      prev.filter((i) => !list.includes(i.normalizedDomainName)),
    );
    removedLocal.forEach((c) =>
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.RemoveFromCart,
        properties: {
          cartItem: {
            amountInUSDCents: c.amountInUSDCents,
            normalizedDomainName: c.normalizedDomainName,
          },
        },
      }),
    );
    return normalize(removedLocal);
  };

  /* ------------------------------- clearCart ----------------------------- */
  const clearCart = async () => {
    if (isAuthenticated) {
      await clearMutation.mutateAsync();
    } else {
      clearLocalCart();
    }
    return [] as UnifiedCartItem[];
  };

  const applyLocalUpdate = (
    updatePayload: ServerUpdateCartItem,
  ): UnifiedCartItem => {
    // Find the item first
    const existingItem = localCart.find((i) => i.id === updatePayload.id);
    if (!existingItem) {
      throw new Error('Cart item not found in local storage');
    }

    // Create updated item immutably, stripping optimistic flag
    const updatedItem = { ...stripOptimistic(existingItem), ...updatePayload };

    // Update local cart immutably
    setLocalCart((prev) =>
      prev.map((i) => (i.id === updatePayload.id ? updatedItem : i)),
    );

    return updatedItem;
  };

  /* -------------------------- sync local on login ------------------------ */
  const syncing = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !localCart.length || syncing.current) return;
    syncing.current = true;
    runAdd(localCart.map(stripOptimistic)).finally(() => {
      clearLocalCart();
      syncing.current = false;
    });
  }, [isAuthenticated, localCart, clearLocalCart, runAdd]);

  /* ------------------------------ helpers ------------------------------- */
  const getCartItemId = useCallback(
    (d: string) => cartData?.find((i) => i.normalizedDomainName === d)?.id,
    [cartData],
  );
  const refetchCart = useCallback(
    () => queryClient.invalidateQueries({ queryKey: CartKey, exact: true }),
    [queryClient, CartKey],
  );

  const isDomainBusy = useCallback(
    (domain: string) => {
      // 1. placeholder while the row is being optimistically added
      if (busyIds.has(domainKey(domain))) return true;

      // 2. any existing row with that domain is busy?
      const maybeIds =
        cartData
          ?.filter((i) => i.normalizedDomainName === domain)
          .map((i) => i.id) ?? [];

      return maybeIds.some((id) => id && busyIds.has(id));
    },
    [busyIds, cartData],
  );

  /* ---------------------------- state flags ------------------------------ */
  const isCartLoading = isAuthenticated ? isServerLoading : false;
  const isCartUpdating = isAuthenticated
    ? addMutation.isPending ||
      removeMutation.isPending ||
      clearMutation.isPending ||
      busyIds.size > 0
    : false;

  return {
    cartData,
    isCartLoading,
    isCartUpdating,
    isDomainInCart,
    isDomainBusy,
    getCartItemId,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    clearLocalCart,
    refetchCart,
  };
}
