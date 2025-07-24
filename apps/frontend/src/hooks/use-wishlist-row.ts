'use client';

import { useWishlistContext } from '@/components/providers/wishlist';
import { useMemo } from 'react';
import {
  wishlistDomainKey,
  isPendingDelete,
  GUEST_USER_ID,
} from './use-wishlist';
import { useAuth } from '@/hooks/use-auth';

interface WishlistRowStatus {
  wishlist: ReturnType<typeof useWishlistContext>;
  inWishlist: boolean;
  isBusy: boolean;
}

export function useWishlistRow(domain?: string): WishlistRowStatus {
  const wishlist = useWishlistContext();
  const { user } = useAuth();
  const userId = user?.id ?? GUEST_USER_ID;

  const { wishlistData } = wishlist;

  return useMemo<WishlistRowStatus>(() => {
    if (!domain) {
      return {
        wishlist,
        inWishlist: false,
        isBusy: false,
      };
    }

    const inWishlist = wishlist.isDomainWishlisted(domain);
    const addingBusy = wishlist.busy.isBusy(wishlistDomainKey(userId, domain));
    const row = wishlistData?.find((i) => i.normalizedDomainName === domain);
    const rowBusy = !!row && wishlist.busy.isBusy(row.id);

    return {
      wishlist,
      inWishlist,
      isBusy: addingBusy || (rowBusy && isPendingDelete(row)),
    };
  }, [domain, wishlistData, userId, wishlist]);
}
