import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  type AddToCartEvent,
  InteractionLoggingEventName,
  type RemoveFromCartEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

/**
 * Type for cart items stored both in server and localStorage
 */
type CartItem = Pick<
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
 * Hook for managing cart functionality (adding/removing items, checking cart status)
 * Handles both authenticated (server-stored) and unauthenticated (localStorage) carts
 */
export function useCart() {
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();
  // Ref to track sync status
  const isSyncing = useRef(false);
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  // Local storage cart for non-authenticated users
  const [localCartItems, setLocalCartItems, removeLocalCartItems] =
    useLocalStorage<CartItem[]>('user-cart-items', []);

  // Cart data fetching from server (for authenticated users)
  const {
    data: serverCartData,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useQuery({
    ...trpc.carts.getItems.queryOptions(),
    enabled: isAuthenticated,
  });

  // Determine which cart data to use based on authentication status
  let cartData = isAuthenticated ? serverCartData : localCartItems;
  if (cartData && cartData.length > 0 && cartData[0].createdAt) {
    cartData = cartData
      .slice()
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  // Cart mutations for authenticated users
  const { isPending: isAddingToServerCart, mutateAsync: addToCartMutateAsync } =
    useMutation({
      ...trpc.carts.addItems.mutationOptions({
        onSuccess: () => refetchCart(),
      }),
    });

  const { mutate: removeFromCartMutate, isPending: isRemovingFromServerCart } =
    useMutation({
      ...trpc.carts.removeItem.mutationOptions({
        onSuccess: () => refetchCart(),
      }),
    });

  const removeFromLocalCart = useCallback(
    (domainName: NamefiNormalizedDomain) => {
      setLocalCartItems((prevItems) =>
        prevItems.filter((item) => item.normalizedDomainName !== domainName),
      );
    },
    [setLocalCartItems],
  );

  // Remove cart item(s) by ID
  const removeItem = useCallback(
    (itemIds: string | string[]) => {
      const idsArray = Array.isArray(itemIds) ? itemIds : [itemIds];

      if (isAuthenticated) {
        // For now, we'll remove items one by one since the backend doesn't support batch removal
        idsArray.forEach((id) => removeFromCartMutate(id));
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
          cartItem,
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
          cartItem,
        },
      };
      logEventWithInteractionLoggers(removeFromCartEvent);
    },
    [logEventWithInteractionLoggers],
  );

  const handleDomainAction = useCallback(
    async (
      items:
        | {
            domainAvailabilityInfo: DomainAvailabilityInfo;
            durationInYears: number;
            operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
            eppAuthorizationCode?: string;
            toggle?: boolean;
          }
        | Array<{
            domainAvailabilityInfo: DomainAvailabilityInfo;
            durationInYears: number;
            operationType: 'REGISTER' | 'IMPORT' | 'RENEW';
            eppAuthorizationCode?: string;
            toggle?: boolean;
          }>,
    ) => {
      // Convert single item to array for uniform processing
      const itemsArray = Array.isArray(items) ? items : [items];
      const cartItemsToAdd: (Omit<CartItem, 'id'> & {
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

        const cartItem: Omit<CartItem, 'id'> & {
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
              removeFromCartMutate(itemId);
              logRemoveFromCart({ ...cartItem, id: itemId });
            } else {
              removeFromLocalCart(domainAvailabilityInfo.domain);
              logRemoveFromCart({ ...cartItem, id: itemId });
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
          results.forEach((result, index) => {
            logAddToCart({ ...cartItemsToAdd[index], id: result.id });
          });
          return results;
        }

        const itemsWithIds = cartItemsToAdd.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        }));
        setLocalCartItems((prevItems) => [...prevItems, ...itemsWithIds]);
        itemsWithIds.forEach((item) => logAddToCart(item));
        return itemsWithIds;
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
        removeLocalCartItems();
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
  }, [
    isAuthenticated,
    localCartItems,
    addToCartMutateAsync,
    removeLocalCartItems,
  ]);

  // Loading states
  const isAddingToCart = isAuthenticated ? isAddingToServerCart : false;
  const isRemovingFromCart = isAuthenticated ? isRemovingFromServerCart : false;
  const isCartDataLoading = isAuthenticated ? isCartLoading : false;

  return {
    cartData,
    isCartDataLoading,
    isAddingToCart,
    isRemovingFromCart,
    isDomainInCart,
    getCartItemId,
    handleDomainAction,
    refetchCart,
    clearLocalCart: removeLocalCartItems,
    removeItem,
  };
}
