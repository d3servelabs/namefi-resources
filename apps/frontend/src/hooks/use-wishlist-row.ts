import { useWishlistContext } from '@/providers/wishlist';
import {
  wishlistDomainKey,
  isPendingDelete,
  GUEST_USER_ID,
} from './use-wishlist';
import { useAuth } from '@/hooks/use-auth';

export function useWishlistRow(domain?: string) {
  const wishlist = useWishlistContext();
  const { user } = useAuth();
  const userId = user?.id ?? GUEST_USER_ID;

  const inWishlist = domain ? wishlist.isDomainWishlisted(domain) : false;

  const addingBusy = domain
    ? wishlist.busy.isBusy(wishlistDomainKey(userId, domain))
    : false;

  const wishlistItem = domain
    ? wishlist.wishlistData?.find((i) => i.normalizedDomainName === domain)
    : undefined;

  const removingBusy =
    wishlistItem &&
    wishlist.busy.isBusy(wishlistItem.id) &&
    isPendingDelete(wishlistItem);

  const updatingBusy =
    wishlistItem &&
    wishlist.busy.isBusy(wishlistItem.id) &&
    !isPendingDelete(wishlistItem);

  return { wishlist, inWishlist, addingBusy, updatingBusy, removingBusy };
}
