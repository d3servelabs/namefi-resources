import { useCartContext } from '@/components/providers/cart';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import { cartDomainKey, isPendingDelete, GUEST_USER_ID } from './use-cart';

export interface RowStatus {
  cart: ReturnType<typeof useCartContext>;
  inCart: boolean;
  addingBusy: boolean;
  updatingBusy: boolean;
  removingBusy: boolean;
}

export function useCartRow(domain?: string): RowStatus {
  const cart = useCartContext();
  const { user } = useAuth();
  const userId = user?.id ?? GUEST_USER_ID;

  const { cartData } = cart;

  return useMemo<RowStatus>(() => {
    if (!domain) {
      return {
        cart,
        inCart: false,
        addingBusy: false,
        updatingBusy: false,
        removingBusy: false,
      };
    }

    const inCart = cart.isDomainInCart(domain);
    const addingBusy = cart.busy.isBusy(cartDomainKey(userId, domain));

    const row = cartData?.find((r) => r.normalizedDomainName === domain);
    const rowBusy = !!row && cart.busy.isBusy(row.id);

    return {
      cart,
      inCart,
      addingBusy,
      updatingBusy: rowBusy && !!row && !isPendingDelete(row),
      removingBusy: rowBusy && !!row && isPendingDelete(row),
    };
  }, [domain, userId, cartData, cart]);
}
