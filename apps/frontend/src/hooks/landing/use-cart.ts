import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  type AddToCartEvent,
  InteractionLoggingEventName,
  type RemoveFromCartEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC, type AppRouterOutput } from '@/utils/trpc';
import {
  type CartItemSelect as DbCartItem,
  itemTypeSchema,
} from '@namefi-astra/db/types';
import {
  computeChargesInUsdOrThrow,
  usdToCents,
} from '@namefi-astra/registrars/multi-year-pricing';
import {
  isDomainImportable,
  isDomainRegistrable,
  getDomainPricingForOperation,
  type DomainAvailabilityInfo,
} from '@namefi-astra/backend/trpc/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

/**
 * Type for enriched cart items returned from the server
 */
type EnrichedCartItem = AppRouterOutput['carts']['getItems'][number];

/**
 * Unified cart item type with common fields from both local and server items
 * This is what all hook functions will return and work with
 */
export type CartItem = {
  id: string;
  normalizedDomainName: string;
  amountInUSDCents: number;
  durationInYears: number;
  createdAt: Date;
  type: 'REGISTER' | 'IMPORT' | 'RENEW';
  registrar: string;
  encryptionKeyId: string | null;
  encryptedEppAuthorizationCode: string | null;
  metadata?: unknown;
  // domainAvailabilityInfo?: DomainAvailabilityInfo;
};

/**
 * Type for internal storage cart items (used in localStorage)
 */
type InternalCartItem = Pick<
  DbCartItem,
  | 'normalizedDomainName'
  | 'amountInUSDCents'
  | 'durationInYears'
  | 'createdAt'
  | 'id'
  | 'encryptionKeyId'
  | 'encryptedEppAuthorizationCode'
  | 'type'
  | 'registrar'
> &
  Partial<Pick<DbCartItem, 'metadata'>> & {
    domainAvailabilityInfo?: DomainAvailabilityInfo;
  };

/**
 * Type for handleDomainAction parameters
 */
type HandleDomainActionParams = {
  domainAvailabilityInfo: DomainAvailabilityInfo;
  durationInYears: number;
  operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
  eppAuthorizationCode?: string;
  toggle?: boolean;
};

/**
 * Type for handleDomainAction function
 */
type HandleDomainActionFunction = (
  items: HandleDomainActionParams | HandleDomainActionParams[],
) => Promise<CartItem[]>;

/**
 * Helper function to normalize cart items to the unified CartItem type
 */
function normalizeCartItems(
  items: (InternalCartItem | EnrichedCartItem)[],
): CartItem[] {
  return items.map((item) => ({
    id: item.id,
    normalizedDomainName: item.normalizedDomainName,
    amountInUSDCents: item.amountInUSDCents,
    durationInYears: item.durationInYears,
    createdAt: item.createdAt,
    type: item.type,
    registrar: item.registrar,
    encryptionKeyId: item.encryptionKeyId,
    encryptedEppAuthorizationCode: item.encryptedEppAuthorizationCode,
    metadata: item.metadata,
    // domainAvailabilityInfo: item.domainAvailabilityInfo,
  }));
}

/**
 * Helper function to convert CartItem array to InteractionLoggingCartItem array
 */
export function cartItemsToInteractionLoggingCartItems(items: CartItem[]) {
  return items.map((item) => ({
    amountInUSDCents: item.amountInUSDCents,
    normalizedDomainName: item.normalizedDomainName as NamefiNormalizedDomain,
  }));
}

/**
 * Hook for managing cart functionality (adding/removing items, checking cart status)
 * Handles both authenticated (server-stored) and unauthenticated (localStorage) carts
 */
export function useCart() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  // Ref to track sync status
  const isSyncing = useRef(false);
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  // Local storage cart for non-authenticated users
  const [localCartItems, setLocalCartItems, clearLocalCart] = useLocalStorage<
    InternalCartItem[]
  >('user-cart-items', []);

  // Cart data fetching from server (for authenticated users)
  const {
    data: serverCartData,
    isLoading: isServerCartLoading,
    refetch: refetchCart,
  } = useQuery({
    ...trpc.carts.getItems.queryOptions(),
    enabled: isAuthenticated,
  });

  // Determine which cart data to use based on authentication status and normalize it
  const cartData = useMemo(() => {
    const rawCartData = isAuthenticated ? serverCartData : localCartItems;
    if (!rawCartData) return undefined;

    let sortedData = rawCartData;
    if (rawCartData.length > 0 && rawCartData[0].createdAt) {
      sortedData = rawCartData
        .slice()
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    }

    return normalizeCartItems(sortedData);
  }, [isAuthenticated, serverCartData, localCartItems]);

  // Cart mutations for authenticated users
  const { isPending: isAddingToServerCart, mutateAsync: addToCartMutateAsync } =
    useMutation({
      ...trpc.carts.addItems.mutationOptions(),
      onSuccess: (data) => {
        // Update the cache with the normalized server response
        queryClient.setQueryData(trpc.carts.getItems.queryKey(), data);
      },
    });

  const { mutate: removeFromCartMutate, isPending: isRemovingFromServerCart } =
    useMutation({
      ...trpc.carts.removeItem.mutationOptions(),
      onSuccess: (data) => {
        // Update the cache with the normalized server response
        queryClient.setQueryData(trpc.carts.getItems.queryKey(), data);
      },
    });

  const {
    mutateAsync: clearServerCartMutateAsync,
    isPending: isClearingServerCart,
  } = useMutation({
    ...trpc.carts.clear.mutationOptions(),
    onSuccess: (data) => {
      // Update the cache with the normalized server response (empty array)
      queryClient.setQueryData(trpc.carts.getItems.queryKey(), data);
    },
  });

  const removeFromLocalCart = useCallback(
    (domainName: NamefiNormalizedDomain) => {
      setLocalCartItems((prevItems) =>
        prevItems.filter((item) => item.normalizedDomainName !== domainName),
      );
    },
    [setLocalCartItems],
  );

  // Remove cart item(s) by ID - now uses bulk endpoint when appropriate
  const removeItem = useCallback(
    (itemIds: string | string[]) => {
      const idsArray = Array.isArray(itemIds) ? itemIds : [itemIds];

      if (isAuthenticated) {
        removeFromCartMutate(idsArray);
      } else {
        setLocalCartItems((prev) =>
          prev.filter((item) => !idsArray.includes(item.id)),
        );
      }
    },
    [isAuthenticated, removeFromCartMutate, setLocalCartItems],
  );

  // Helper functions
  const isDomainInCart = useCallback(
    (domainName: string) => {
      return !!cartData?.some(
        (item) => item.normalizedDomainName === domainName,
      );
    },
    [cartData],
  );

  const getCartItemId = useCallback(
    (domainName: string) => {
      const foundItem = cartData?.find(
        (item) => item.normalizedDomainName === domainName,
      );
      return foundItem?.id;
    },
    [cartData],
  );

  const logAddToCart = useCallback(
    (cartItem: CartItem) => {
      const addToCartEvent: AddToCartEvent = {
        name: InteractionLoggingEventName.AddToCart,
        properties: {
          cartItem: {
            amountInUSDCents: cartItem.amountInUSDCents,
            normalizedDomainName:
              cartItem.normalizedDomainName as NamefiNormalizedDomain,
          },
        },
      };
      logEventWithInteractionLoggers(addToCartEvent);
    },
    [logEventWithInteractionLoggers],
  );

  const logRemoveFromCart = useCallback(
    (cartItem: CartItem) => {
      const removeFromCartEvent: RemoveFromCartEvent = {
        name: InteractionLoggingEventName.RemoveFromCart,
        properties: {
          cartItem: {
            amountInUSDCents: cartItem.amountInUSDCents,
            normalizedDomainName:
              cartItem.normalizedDomainName as NamefiNormalizedDomain,
          },
        },
      };
      logEventWithInteractionLoggers(removeFromCartEvent);
    },
    [logEventWithInteractionLoggers],
  );

  const handleDomainAction = useCallback<HandleDomainActionFunction>(
    async (items) => {
      // Convert single item to array for uniform processing
      const itemsArray = Array.isArray(items) ? items : [items];
      const cartItemsToAdd: (Omit<InternalCartItem, 'id'> & {
        eppAuthorizationCode?: string;
      })[] = [];

      for (const item of itemsArray) {
        const {
          domainAvailabilityInfo,
          durationInYears,
          operationType,
          eppAuthorizationCode,
          toggle = true,
        } = item;
        if (
          operationType === 'IMPORT' &&
          !isDomainImportable(domainAvailabilityInfo)
        ) {
          throw new Error('Domain is not importable');
        }

        if (
          operationType === 'REGISTER' &&
          !isDomainRegistrable(domainAvailabilityInfo)
        ) {
          throw new Error('Domain is not registrable');
        }

        // Get appropriate pricing for the operation
        const pricingDetails = getDomainPricingForOperation(
          domainAvailabilityInfo,
          operationType,
        );

        if (!pricingDetails) {
          throw new Error(`${operationType} pricing details are unavailable`);
        }

        const chargeAmountInUsd = computeChargesInUsdOrThrow(
          pricingDetails,
          durationInYears,
        );
        const calculatedAmount = usdToCents(chargeAmountInUsd);

        const cartItem: Omit<InternalCartItem, 'id'> & {
          eppAuthorizationCode?: string;
        } = {
          normalizedDomainName: domainAvailabilityInfo.domain,
          amountInUSDCents: calculatedAmount,
          durationInYears,
          createdAt: new Date(),
          type: operationType,
          // TODO: (sid->sami) add "namefi" in registar and make it required
          registrar: domainAvailabilityInfo.registrarKey || 'namefi',
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          eppAuthorizationCode:
            operationType === itemTypeSchema.Values.IMPORT
              ? eppAuthorizationCode
              : undefined,
        };

        if (isDomainInCart(domainAvailabilityInfo.domain)) {
          if (!toggle) {
            // If toggle is false and domain is already in cart, do nothing
            continue;
          }
          // Remove domain from cart (toggle behavior)
          const itemId = getCartItemId(domainAvailabilityInfo.domain);
          if (itemId) {
            if (isAuthenticated) {
              removeFromCartMutate([itemId]);
              logRemoveFromCart({
                ...cartItem,
                id: itemId,
                // domainAvailabilityInfo,
              });
            } else {
              removeFromLocalCart(domainAvailabilityInfo.domain);
              logRemoveFromCart({
                ...cartItem,
                id: itemId,
                // domainAvailabilityInfo,
              });
            }
          }
        } else {
          // Add to batch
          cartItemsToAdd.push(cartItem);
        }
      }

      // Batch add all items
      if (cartItemsToAdd.length > 0) {
        if (isAuthenticated) {
          const results = await addToCartMutateAsync(cartItemsToAdd);
          const normalizedResults = normalizeCartItems(results);
          normalizedResults.forEach((result) => {
            logAddToCart(result);
          });
          return normalizedResults;
        }

        const itemsWithIds = cartItemsToAdd.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        }));
        setLocalCartItems((prevItems) => [...prevItems, ...itemsWithIds]);
        const normalizedLocalResults = normalizeCartItems(itemsWithIds);
        normalizedLocalResults.forEach((item) => logAddToCart(item));
        return normalizedLocalResults;
      }
      return [];
    },
    [
      isDomainInCart,
      getCartItemId,
      removeFromCartMutate,
      addToCartMutateAsync,
      isAuthenticated,
      setLocalCartItems,
      removeFromLocalCart,
      logAddToCart,
      logRemoveFromCart,
    ],
  );

  // Sync local cart to server when user authenticates
  useEffect(() => {
    const syncLocalCartToServer = async () => {
      if (
        !isAuthenticated ||
        localCartItems.length === 0 ||
        isSyncing.current
      ) {
        return;
      }

      try {
        isSyncing.current = true;
        const backendItems = localCartItems.map(({ id, ...item }) => item);
        // Only call if there are items to add
        if (backendItems.length > 0) {
          await addToCartMutateAsync(backendItems);
        }
        clearLocalCart();
      } catch (error) {
        console.error('Failed to sync local cart to server:', error);
        // Don't clear local cart on failure to prevent data loss
      } finally {
        isSyncing.current = false;
      }
    };

    if (isAuthenticated && localCartItems.length > 0) {
      syncLocalCartToServer();
    }
  }, [isAuthenticated, localCartItems, addToCartMutateAsync, clearLocalCart]);

  // Loading states
  const isAddingToCart = isAuthenticated ? isAddingToServerCart : false;
  const isRemovingFromCart = isAuthenticated ? isRemovingFromServerCart : false;
  const isCartLoading = isAuthenticated ? isServerCartLoading : false;
  const isClearingCart = isAuthenticated ? isClearingServerCart : false;

  // Unified clear cart function that handles both server and local storage
  const clearCart = useCallback(async (): Promise<CartItem[]> => {
    if (isAuthenticated) {
      // Clear server cart
      const result = await clearServerCartMutateAsync();
      return normalizeCartItems(result);
    }
    // Clear local storage cart
    clearLocalCart();
    return [];
  }, [isAuthenticated, clearServerCartMutateAsync, clearLocalCart]);

  const isCartUpdating = useMemo(() => {
    return isAddingToCart || isRemovingFromCart || isClearingCart;
  }, [isAddingToCart, isRemovingFromCart, isClearingCart]);

  return {
    cartData,
    isCartLoading,
    isCartUpdating,
    isDomainInCart,
    getCartItemId,
    handleDomainAction,
    refetchCart,
    clearLocalCart,
    clearCart,
    removeItem,
  };
}
