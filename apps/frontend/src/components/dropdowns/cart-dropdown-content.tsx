'use client';

import { useInteractionLoggers } from '@/components/providers/analytics';
import {
  cartItemsToInteractionLoggingCartItems,
  type UnifiedCartItem,
} from '@/hooks/use-cart';
import { useCartRow } from '@/hooks/use-cart-row';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { formatAmountInUSD } from '@/lib/number';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { type FC, type MouseEvent, useCallback, useMemo } from 'react';

export type CartDropdownContentProps = {
  items: UnifiedCartItem[];
  totalAmountInUsdCents: number;
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

export function CartDropdownContent({
  items,
  totalAmountInUsdCents,
}: CartDropdownContentProps) {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const isCartEmpty = items.length === 0;

  const logBeginCheckout = useCallback(() => {
    logEventWithInteractionLoggers({
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {
        totalAmountInUsdCents,
        cartItems: cartItemsToInteractionLoggingCartItems(items),
      },
    });
  }, [items, logEventWithInteractionLoggers, totalAmountInUsdCents]);

  return (
    <>
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
    </>
  );
}
