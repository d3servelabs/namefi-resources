import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for managing cart functionality (adding/removing items, checking cart status)
 */
export function useCart() {
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();

  // Cart data fetching
  const {
    data: cartData,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    refetch: refetchCart,
  } = useQuery({
    ...trpc.carts.getItems.queryOptions(),
    enabled: isAuthenticated,
  });

  // Cart mutations
  const { mutate: addToCartMutate, isPending: isAddingToCart } = useMutation({
    ...trpc.carts.addItem.mutationOptions({
      onSuccess: () => refetchCart(),
    }),
  });

  const { mutate: removeFromCartMutate, isPending: isRemovingFromCart } =
    useMutation({
      ...trpc.carts.removeItem.mutationOptions({
        onSuccess: () => refetchCart(),
      }),
    });

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
      return cartData?.find((item) => item.normalizedDomainName === domainName)
        ?.id;
    },
    [cartData],
  );

  const handleDomainAction = useCallback(
    (domain: { domain: string; priceInUSD?: number | null }) => {
      if (isDomainInCart(domain.domain)) {
        const itemId = getCartItemId(domain.domain);
        if (itemId) {
          removeFromCartMutate(itemId);
        }
      } else {
        addToCartMutate({
          normalizedDomainName: domain.domain,
          amountInUSDCents: domain.priceInUSD ? domain.priceInUSD * 100 : 0,
        });
      }
    },
    [isDomainInCart, getCartItemId, removeFromCartMutate, addToCartMutate],
  );

  const isCartDataLoading = isCartLoading || isCartFetching;

  return {
    cartData,
    isCartDataLoading,
    isAddingToCart,
    isRemovingFromCart,
    isDomainInCart,
    getCartItemId,
    handleDomainAction,
    refetchCart,
  };
}
