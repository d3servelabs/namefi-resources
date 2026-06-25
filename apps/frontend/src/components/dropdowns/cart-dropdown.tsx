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
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  useMemo,
  useState,
} from 'react';
import NumberFlow from '@number-flow/react';
import { HEADER_BADGE_CLASS } from '@/components/header.tokens';
import type { CartDropdownContentProps } from './cart-dropdown-content';

const CartDropdownContent = dynamic<CartDropdownContentProps>(
  () =>
    import('./cart-dropdown-content').then((mod) => mod.CartDropdownContent),
  {
    ssr: false,
    loading: () => <CartDropdownContentFallback />,
  },
);

export type CartDropdownProps = Omit<ComponentPropsWithoutRef<'div'>, 'ref'> & {
  disableBackdropBlur?: boolean;
};

function CartDropdownContentFallback() {
  const t = useTranslations('cart');
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{t('cartDropdown.myCart')}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="justify-start font-medium italic">
        <Loader2 className="me-2 size-4 animate-spin" />
        <span>{t('cartDropdown.loadingCart')}</span>
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
      <div ref={ref} className={cn('', className)} {...rest}>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <HeaderActionButton
                actionVariant="icon"
                disableBackdropBlur={disableBackdropBlur}
                className="text-white/90"
              />
            }
          >
            <ShoppingCart className="h-5 w-5" />
            {items.length > 0 && (
              <div
                key="cart-badge"
                className={cn('animate-badge-pop', HEADER_BADGE_CLASS)}
              >
                <NumberFlow value={items.length} />
              </div>
            )}
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
      </div>
    );
  },
);

CartDropdown.displayName = 'CartDropdown';
