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
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatAmountInUSDCents } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useMemo,
} from 'react';

export type vProps = HTMLAttributes<HTMLDivElement>;

export const CartDropdown: ForwardRefExoticComponent<vProps> = forwardRef<
  HTMLDivElement,
  vProps
>(function v(
  { className, ...rest }: vProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const trpc = useTRPC();

  const { isAuthenticated } = useAuth();

  const cartQuery = useQuery({
    ...trpc.carts.getOrCreate.queryOptions(),
    enabled: isAuthenticated,
  });

  const items = useMemo(
    () => cartQuery?.data?.items ?? [],
    [cartQuery?.data?.items],
  );

  const totlaAmountInUSDCents = useMemo(
    () => items.reduce((sum, item) => sum + item.amountInUSDCents, 0),
    [items],
  );

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
        {items.length > 0 && (
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
                    {formatAmountInUSDCents(item.amountInUSDCents)}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-between font-medium">
              <span>Total</span>
              <span>{formatAmountInUSDCents(totlaAmountInUSDCents)}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild={true}>
              <Button className="w-full" variant="default" asChild={true}>
                <Link href="/cart">Checkout</Link>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
});

CartDropdown.displayName = 'CartDropdown';
