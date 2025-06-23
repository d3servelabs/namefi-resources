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
  getDomainPricingForOperation,
  type DomainAvailabilityInfo,
} from '@namefi-astra/backend/trpc/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from 'usehooks-ts';

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
    (domainName: string) => {
      setLocalCartItems((prevItems) =>
        prevItems.filter((item) => item.normalizedDomainName !== domainName),
      );
    },
    [setLocalCartItems],
  );

  // Remove cart item by ID
  const removeItem = useCallback(
    (itemId: string) => {
      if (isAuthenticated) {
        removeFromCartMutate(itemId);
      } else {
        setLocalCartItems((prev) => prev.filter((item) => item.id !== itemId));
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
    async ({
      domainAvailabilityInfo,
      durationInYears = 3,
      eppAuthorizationCode,
    }: {
      domainAvailabilityInfo: DomainAvailabilityInfo;
      durationInYears?: number;
      eppAuthorizationCode?: string;
    }) => {
      // Determine operation type based on domain availability
      const operationType = isDomainImportable(domainAvailabilityInfo)
        ? itemTypeSchema.Values.IMPORT
        : itemTypeSchema.Values.REGISTER;

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

      const cartItem: Omit<CartItem, 'id'> & { eppAuthorizationCode?: string } =
        {
          normalizedDomainName: domainAvailabilityInfo.domain,
          amountInUSDCents: calculatedAmount,
          durationInYears,
          createdAt: new Date(),
          type: operationType,
          encryptionKeyId: null,
          encryptedEppAuthorizationCode: null,
          eppAuthorizationCode:
            operationType === itemTypeSchema.Values.IMPORT
              ? eppAuthorizationCode
              : undefined,
        };

      if (isDomainInCart(domainAvailabilityInfo.domain)) {
        // Remove domain from cart
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
      } else if (isAuthenticated) {
        // here we should get the id from mutation result
        const [{ id: itemId }] = await addToCartMutateAsync([cartItem]);
        logAddToCart({ ...cartItem, id: itemId });
      } else {
        const itemId = crypto.randomUUID();
        setLocalCartItems((prevItems) => [
          ...prevItems,
          { ...cartItem, id: itemId },
        ]);
        logAddToCart({ ...cartItem, id: itemId });
      }
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
