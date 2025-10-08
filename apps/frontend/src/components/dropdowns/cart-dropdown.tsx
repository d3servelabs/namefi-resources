'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { cartItemsToInteractionLoggingCartItems } from '@/hooks/use-cart';
import { useCartContext } from '@/components/providers/cart';
import { cn } from '@/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { formatAmountInUSD } from '@/lib/number';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useCallback, useMemo } from 'react';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { motion, type HTMLMotionProps, AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import {
  HEADER_BADGE_CLASS,
  HEADER_ICON_BUTTON_CLASS,
} from '@/components/header.tokens';

const MotionButton = motion.create(Button);

export type CartDropdownProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  disableBackdropBlur?: boolean;
};

export const CartDropdown = forwardRef<HTMLDivElement, CartDropdownProps>(
  function v(
    { className, disableBackdropBlur = false, ...rest }: CartDropdownProps,
    ref,
  ) {
    const { logEventWithInteractionLoggers } = useInteractionLoggers();
    const { cartData: items = [] } = useCartContext();

    const totalAmountInUsdCents = useMemo(
      () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
      [items],
    );

    const logBeginCheckout = useCallback(() => {
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.BeginCheckout,
        properties: {
          totalAmountInUsdCents,
          cartItems: cartItemsToInteractionLoggingCartItems(items),
        },
      });
    }, [items, logEventWithInteractionLoggers, totalAmountInUsdCents]);

    const isCartEmpty = items.length === 0;

    return (
      <motion.div ref={ref} className={cn('', className)} {...rest} layout>
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <MotionButton
              className={cn(
                HEADER_ICON_BUTTON_CLASS,
                'text-white/90',
                !disableBackdropBlur &&
                  'supports-[backdrop-filter]:backdrop-blur-md',
                disableBackdropBlur &&
                  'supports-[backdrop-filter]:backdrop-blur-none',
              )}
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
            </MotionButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Cart</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex justify-between"
                >
                  <span>{item.normalizedDomainName}</span>
                  <span className="text-muted-foreground">
                    {formatAmountInUSD(item.amountInUSDCents, true)}
                  </span>
                </DropdownMenuItem>
              ))}
              {isCartEmpty && (
                <DropdownMenuItem className="justify-start font-medium italic">
                  <span>Your cart is empty</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-between font-medium">
              <span>Total</span>
              <span>{formatAmountInUSD(totalAmountInUsdCents, true)}</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild={true}>
              <Button
                className="w-full"
                variant="default"
                asChild={!isCartEmpty}
                disabled={isCartEmpty}
              >
                <Link href="/cart" onClick={logBeginCheckout}>
                  Checkout
                </Link>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  },
);

CartDropdown.displayName = 'CartDropdown';
