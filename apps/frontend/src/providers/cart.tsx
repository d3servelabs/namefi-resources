'use client';

import { createContext, useContext, type FC, type ReactNode } from 'react';
import { useCart, type UseCart } from '@/hooks/landing/use-cart';

export const CartContext = createContext<UseCart | null>(null);

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const cart = useCart();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
