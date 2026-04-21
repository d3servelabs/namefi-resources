'use client';

import { HeaderActionButton } from '@/components/header-action-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { cartItemsToInteractionLoggingCartItems } from '@/hooks/use-cart';
import { useCartContext } from '@/components/providers/cart';
import { useCartRow } from '@/hooks/use-cart-row';
import type { UnifiedCartItem } from '@/hooks/use-cart';
import { cn } from '@namefi-astra/ui/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { formatAmountInUSD } from '@/lib/number';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useCallback, useMemo, type FC } from 'react';
import type { MouseEvent } from 'react';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { motion, type HTMLMotionProps, AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { HEADER_BADGE_CLASS } from '@/components/header.tokens';

const MotionHeaderActionButton = motion.create(HeaderActionButton);

export type CartDropdownProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  disableBackdropBlur?: boolean;
};

type CartDropdownItemProps = {
  item: UnifiedCartItem;
};

const DomainDisplayName: FC<{ normalizedDomainName: string }> = ({
  normalizedDomainName,
}) => {
  const displayName = useMemo(() => {
    try {
      return toUnicodeDomainName(normalizedDomainName);
    } catch {
      return normalizedDomainName;
    }
  }, [normalizedDomainName]);

  return <>{displayName}</>;
};

function CartDropdownItem({ item }: CartDropdownItemProps) {
  const { cart, removingBusy } = useCartRow(item.normalizedDomainName);
  const { removeItem } = cart;

  const handleRemove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void removeItem([item.normalizedDomainName]);
    },
    [removeItem, item.normalizedDomainName],
  );

  return (
    <DropdownMenuItem
      className="flex items-center gap-3"
      onSelect={(event) => event.preventDefault()}
    >
      <span className="flex-1 truncate">
        <DomainDisplayName normalizedDomainName={item.normalizedDomainName} />
      </span>
      <span className="text-muted-foreground">
        {formatAmountInUSD(item.amountInUSDCents, true)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={handleRemove}
        disabled={removingBusy}
        aria-label={`Remove ${item.normalizedDomainName} from cart`}
      >
        {removingBusy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </DropdownMenuItem>
  );
}

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
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Cart</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {items.map((item) => (
                <CartDropdownItem
                  key={item.id ?? item.normalizedDomainName}
                  item={item}
                />
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
            <DropdownMenuItem className="p-0">
              <Button
                className="w-full"
                variant="default"
                render={
                  isCartEmpty ? undefined : (
                    <Link href="/cart" onClick={logBeginCheckout} />
                  )
                }
                nativeButton={isCartEmpty}
                disabled={isCartEmpty}
              >
                Checkout
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  },
);

CartDropdown.displayName = 'CartDropdown';
