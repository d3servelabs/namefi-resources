import { useCartContext } from '@/providers/cart';
import { useMemo } from 'react';
import { domainKey, isPendingDelete } from './landing/use-cart';

export function useCartRow(domain: string) {
  const cart = useCartContext();

  return useMemo(() => {
    const inCart = cart.isDomainInCart(domain);
    const addingBusy = cart.busy.isBusy(domainKey(domain));
    const cartRowId = cart.getCartItemId(domain);
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
