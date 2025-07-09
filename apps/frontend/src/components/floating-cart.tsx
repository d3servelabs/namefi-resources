import {
  useCart,
  cartItemsToInteractionLoggingCartItems,
} from '@/hooks/landing/use-cart';
import {
  type BeginCheckoutEvent,
  InteractionLoggingEventName,
} from '@/utils/interaction-logging/events';
import { ShoppingCartIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useInteractionLoggers } from './providers/interactionLoggersProvider';
import { Button } from './ui/shadcn/button';

const FloatingCart = () => {
  const { cartData: items } = useCart();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();

  const totalAmountInUsdCents = useMemo(
    () => items?.reduce((sum, item) => sum + item.amountInUSDCents, 0) ?? 0,
    [items],
  );

  const logBeginCheckout = useCallback(() => {
    const beginCheckoutEvent: BeginCheckoutEvent = {
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {
        totalAmountInUsdCents,
        cartItems: items
          ? cartItemsToInteractionLoggingCartItems(items)
          : undefined,
      },
    };
    logEventWithInteractionLoggers(beginCheckoutEvent);
  }, [items, logEventWithInteractionLoggers, totalAmountInUsdCents]);

  return items && items.length > 0 ? (
    <div className="flex justify-between items-center p-4 rounded-xl bg-white/3 border border-white/10 backdrop-blur-3xl w-full md:w-1/2">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Total:</span>
        <span className="text-lg font-bold">
          ${totalAmountInUsdCents / 100} USD
        </span>
      </div>
      <Button
        className="relative"
        variant="outline"
        onClick={() => {
          logBeginCheckout();
          router.push('/cart');
        }}
      >
        <ShoppingCartIcon className="size-4" />
        View cart
        <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-brand-primary text-white text-xs px-2 py-1 rounded-full">
          {items?.length}
        </div>
      </Button>
    </div>
  ) : null;
};

export default FloatingCart;
