'use client';

import { createContext, useContext, type FC, type ReactNode } from 'react';
import { useWishlist, type UseWishlist } from '@/hooks/use-wishlist';

export const WishlistContext = createContext<UseWishlist | null>(null);

export const WishlistProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const wishlist = useWishlist();
  return (
    <WishlistContext.Provider value={wishlist}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error(
      'useWishlistContext must be used within a WishlistProvider',
    );
  }
  return context;
};
