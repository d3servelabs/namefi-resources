'use client';

import { Badge } from '@/components/ui/shadcn/badge';
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
import { cartItemsToInteractionLoggingCartItems } from '@/hooks/landing/use-cart';
import { useCartContext } from '@/providers/cart';
import { cn } from '@/lib/utils';
import {
  type BeginCheckoutEvent,
  InteractionLoggingEventName,
} from '@/utils/interaction-logging/events';
import { formatAmountInUSD } from '@/utils/number';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import { useInteractionLoggers } from '../providers/interactionLoggersProvider';

export type CartDropdownProps = HTMLAttributes<HTMLDivElement>;

export const CartDropdown: ForwardRefExoticComponent<CartDropdownProps> =
  forwardRef<HTMLDivElement, CartDropdownProps>(function v(
    { className, ...rest }: CartDropdownProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const { logEventWithInteractionLoggers } = useInteractionLoggers();
    const { cartData: items = [] } = useCartContext();

    const totalAmountInUsdCents = useMemo(
      () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
      [items],
    );

    const logBeginCheckout = useCallback(() => {
      const beginCheckoutEvent: BeginCheckoutEvent = {
        name: InteractionLoggingEventName.BeginCheckout,
        properties: {
          totalAmountInUsdCents,
          cartItems: cartItemsToInteractionLoggingCartItems(items),
        },
      };
      logEventWithInteractionLoggers(beginCheckoutEvent);
    }, [items, logEventWithInteractionLoggers, totalAmountInUsdCents]);

    const isCartEmpty = items.length === 0;

    return (
      <div ref={ref} className={cn('', className)} {...rest}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {items.length}
                </Badge>
              )}
            </Button>
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
      </div>
    );
  });

CartDropdown.displayName = 'CartDropdown';
