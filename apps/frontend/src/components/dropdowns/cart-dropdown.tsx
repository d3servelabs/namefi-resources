'use client';

import { HeaderActionButton } from '@/components/header-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { useCartContext } from '@/components/providers/cart';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2, ShoppingCart } from 'lucide-react';
import dynamic from 'next/dynamic';
import { forwardRef, useMemo, useState } from 'react';
import { motion, type HTMLMotionProps, AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { HEADER_BADGE_CLASS } from '@/components/header.tokens';
import type { CartDropdownContentProps } from './cart-dropdown-content';

const MotionHeaderActionButton = motion.create(HeaderActionButton);

const CartDropdownContent = dynamic<CartDropdownContentProps>(
  () =>
    import('./cart-dropdown-content').then((mod) => mod.CartDropdownContent),
  {
    ssr: false,
    loading: () => <CartDropdownContentFallback />,
  },
);

export type CartDropdownProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  disableBackdropBlur?: boolean;
};

function CartDropdownContentFallback() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>My Cart</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="justify-start font-medium italic">
        <Loader2 className="me-2 size-4 animate-spin" />
        <span>Loading cart...</span>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

export const CartDropdown = forwardRef<HTMLDivElement, CartDropdownProps>(
  function v(
    { className, disableBackdropBlur = false, ...rest }: CartDropdownProps,
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const { cartData: items = [] } = useCartContext();

    const totalAmountInUsdCents = useMemo(
      () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
      [items],
    );

    return (
      <motion.div ref={ref} className={cn('', className)} {...rest} layout>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <MotionHeaderActionButton
                actionVariant="icon"
                disableBackdropBlur={disableBackdropBlur}
                className="text-white/90"
              />
            }
          >
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence initial={false} mode="popLayout">
              {items.length > 0 && (
                <motion.div
                  key="cart-badge"
                  className={HEADER_BADGE_CLASS}
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                >
                  <NumberFlow value={items.length} />
                </motion.div>
              )}
            </AnimatePresence>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            {open ? (
              <CartDropdownContent
                items={items}
                totalAmountInUsdCents={totalAmountInUsdCents}
              />
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  },
);

CartDropdown.displayName = 'CartDropdown';
