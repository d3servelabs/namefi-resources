import { useCartContext } from '@/providers/cart';
import { useMemo } from 'react';
import { domainKey, isPendingDelete } from './use-cart';

export function useCartRow(domain: string | undefined) {
  const cart = useCartContext();

  return useMemo(() => {
    const inCart = domain ? cart.isDomainInCart(domain) : false;
    const addingBusy = domain ? cart.busy.isBusy(domainKey(domain)) : false;
    const cartRowId = domain ? cart.getCartItemId(domain) : undefined;
    const removingBusy = cartRowId
      ? cart.busy.isBusy(cartRowId) && isPendingDelete(cart.cartData, cartRowId)
      : false;
    const updatingBusy = cartRowId
      ? cart.busy.isBusy(cartRowId) &&
        !isPendingDelete(cart.cartData, cartRowId)
      : false;
    return { cart, inCart, addingBusy, updatingBusy, removingBusy };
  }, [cart, domain]);
}
