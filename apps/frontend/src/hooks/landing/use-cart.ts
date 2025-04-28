import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import type { CartItemSelect as DbCartItem } from '@namefi-astra/db/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

/**
 * Type for cart items stored both in server and localStorage
 */
type CartItem = Pick<
  DbCartItem,
  'normalizedDomainName' | 'amountInUSDCents' | 'metadata'
>;

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

  // Local storage cart for non-authenticated users
  const [localCartItems, setLocalCartItems, removeLocalCartItems] =
    useLocalStorage<LocalCartItem[]>('user-cart-items', []);

  // Cart data fetching from server (for authenticated users)
  const {
    data: serverCartData,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
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
    ...trpc.carts.addItem.mutationOptions({
      onSuccess: () => refetchCart(),
    }),
  });

  const { mutate: removeFromCartMutate, isPending: isRemovingFromServerCart } =
    useMutation({
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

  const handleDomainAction = useCallback(
    (domain: { domain: string; priceInUSD?: number | null }) => {
      const domainName = domain.domain;

      if (isDomainInCart(domainName)) {
        // Remove domain from cart
        if (isAuthenticated) {
          const itemId = getCartItemId(domainName);
          if (itemId) {
            removeFromCartMutate(itemId);
          }
        } else {
          removeFromLocalCart(domainName);
        }
      } else {
        // Add domain to cart
        const cartItem: CartItem = {
          normalizedDomainName: domainName,
          amountInUSDCents: domain.priceInUSD ? domain.priceInUSD * 100 : 0,
          metadata: {},
        };

        if (isAuthenticated) {
          addToCartMutate(cartItem);
        } else {
          addToLocalCart(cartItem);
        }
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
    ],
  );

  // Sync local cart to server when user authenticates
  useEffect(() => {
    const syncLocalCartToServer = async () => {
      if (!isAuthenticated || localCartItems.length === 0) {
        return;
      }

      try {
        // Process items in sequence to prevent race conditions
        for (const item of localCartItems) {
          // Extract just the fields needed for the server (omit local id)
          const { id, ...backendItem } = item;
          await addToCartMutateAsync(backendItem);
        }
        // Clear local cart after successful sync
        removeLocalCartItems();
      } catch (error) {
        console.error('Failed to sync local cart to server:', error);
        // Don't clear local cart on failure to prevent data loss
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
  const isCartDataLoading = isAuthenticated
    ? isCartLoading || isCartFetching
    : false;

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
  };
}
