import { useInteractionLoggers } from '@/components/providers/interactionLoggersProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  type AddToCartEvent,
  InteractionLoggingEventName,
  type RemoveFromCartEvent,
} from '@/utils/interaction-logging/events';
import { useTRPC } from '@/utils/trpc';
import type { CartItemSelect as DbCartItem } from '@namefi-astra/db/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from 'usehooks-ts';

/**
 * Type for cart items stored both in server and localStorage
 */
type CartItem = Pick<DbCartItem, 'normalizedDomainName' | 'amountInUSDCents'> &
  Partial<Pick<DbCartItem, 'metadata'>>;

/**
 * Type for local cart items with client-side generated ID
 */
type LocalCartItem = CartItem & Pick<DbCartItem, 'id'>;

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
    useLocalStorage<LocalCartItem[]>('user-cart-items', []);

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
  const cartData = isAuthenticated ? serverCartData : localCartItems;

  // Cart mutations for authenticated users
  const {
    mutate: addToCartMutate,
    isPending: isAddingToServerCart,
    mutateAsync: addToCartMutateAsync,
  } = useMutation({
    ...trpc.carts.addItems.mutationOptions({
      onSuccess: () => refetchCart(),
    }),
  });

  const {
    mutate: removeFromCartMutate,
    isPending: isRemovingFromServerCart,
    mutateAsync: removeFromCartMutateAsync,
  } = useMutation({
    ...trpc.carts.removeItem.mutationOptions({
      onSuccess: () => refetchCart(),
    }),
  });

  // Local cart operations
  const addToLocalCart = useCallback(
    (item: CartItem) => {
      const localItem: LocalCartItem = {
        ...item,
        id: crypto.randomUUID(),
      };
      setLocalCartItems((prevItems) => [...prevItems, localItem]);
    },
    [setLocalCartItems],
  );

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
        name: InteractionLoggingEventName.ADD_TO_CART,
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
        name: InteractionLoggingEventName.REMOVE_FROM_CART,
        properties: {
          cartItem,
        },
      };
      logEventWithInteractionLoggers(removeFromCartEvent);
    },
    [logEventWithInteractionLoggers],
  );

  const handleDomainAction = useCallback(
    (domain: { domain: string; priceInUSD?: number | null }) => {
      const domainName = domain.domain;
      const cartItem: CartItem = {
        normalizedDomainName: domainName,
        amountInUSDCents: domain.priceInUSD ? domain.priceInUSD * 100 : 0,
      };

      if (isDomainInCart(domainName)) {
        // Remove domain from cart
        if (isAuthenticated) {
          const itemId = getCartItemId(domainName);
          if (itemId) {
            removeFromCartMutate(itemId);
            logRemoveFromCart(cartItem);
          }
        } else {
          removeFromLocalCart(domainName);
          logRemoveFromCart(cartItem);
        }
      } else if (isAuthenticated) {
        addToCartMutate([cartItem]);
        logAddToCart(cartItem);
      } else {
        addToLocalCart(cartItem);
        logAddToCart(cartItem);
      }
    },
    [
      isDomainInCart,
      getCartItemId,
      removeFromCartMutate,
      addToCartMutate,
      isAuthenticated,
      addToLocalCart,
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
