import { cartItemsToInteractionLoggingCartItems } from '@/hooks/use-cart';
import { useCartContext } from '@/components/providers/cart';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { ShoppingCartIcon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { Button } from './ui/shadcn/button';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { SearchMode } from './search/types';
import { useCart } from '@/hooks/use-cart';

interface ImportableDomain {
  domain: NamefiNormalizedDomain;
  availabilityInfo: DomainAvailabilityInfo;
  eppAuthorizationCode: string;
}

interface FloatingCartProps {
  searchMode?: SearchMode;
  importableDomains?: ImportableDomain[];
  onBusyChange?: (isBusy: boolean) => void;
}

const FloatingCart = ({
  searchMode,
  importableDomains,
  onBusyChange,
}: FloatingCartProps) => {
  const { cartData: items } = useCartContext();
  const cart = useCart();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();
  const [isAddingAll, setIsAddingAll] = useState(false);

  const totalAmountInUsdCents = useMemo(
    () => items?.reduce((sum, item) => sum + item.amountInUSDCents, 0) ?? 0,
    [items],
  );

  // Filter out domains already in cart
  const filteredImportableDomains = useMemo(() => {
    if (!importableDomains || !items) return importableDomains;

    const cartDomains = new Set(items.map((item) => item.normalizedDomainName));
    return importableDomains.filter(({ domain }) => !cartDomains.has(domain));
  }, [importableDomains, items]);

  const logBeginCheckout = useCallback(() => {
    logEventWithInteractionLoggers({
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {
        totalAmountInUsdCents,
        cartItems: items
          ? cartItemsToInteractionLoggingCartItems(items)
          : undefined,
      },
    });
  }, [items, logEventWithInteractionLoggers, totalAmountInUsdCents]);

  // Add all valid domains to cart
  const handleAddAllToCart = useCallback(async () => {
    if (!filteredImportableDomains || filteredImportableDomains.length === 0)
      return;

    setIsAddingAll(true);
    onBusyChange?.(true);

    try {
      const validItems = filteredImportableDomains
        .map(({ availabilityInfo, eppAuthorizationCode }) => {
          if (!eppAuthorizationCode || !eppAuthorizationCode.trim())
            return null;

          const minDuration =
            availabilityInfo.durationValidationInYears?.min ?? 1;
          return {
            domainAvailabilityInfo: availabilityInfo,
            durationInYears: minDuration,
            operationType: 'IMPORT' as const,
            eppAuthorizationCode: eppAuthorizationCode,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (validItems.length > 0) {
        await cart.addItem(validItems);
      }
    } catch (error) {
      console.error('Failed to add all domains to cart:', error);
    } finally {
      setIsAddingAll(false);
      onBusyChange?.(false);
    }
  }, [filteredImportableDomains, cart, onBusyChange]);

  const shouldShowAddAllButton =
    searchMode === SearchMode.IMPORT &&
    filteredImportableDomains &&
    filteredImportableDomains.length > 0;

  return items && items.length > 0 ? (
    <div className="flex justify-between items-center p-4 rounded-xl bg-white/3 border border-white/10 backdrop-blur-3xl w-full md:w-1/2">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Total:</span>
        <span className="text-lg font-bold">
          ${totalAmountInUsdCents / 100} USD
        </span>
      </div>
      <div className="flex items-center gap-2">
        {shouldShowAddAllButton && (
          <Button
            className="relative"
            variant="outline"
            onClick={handleAddAllToCart}
            disabled={isAddingAll}
          >
            {isAddingAll ? (
              <Plus className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add all to cart ({filteredImportableDomains.length})
          </Button>
        )}
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
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-brand-primary text-secondary-foreground text-xs px-2 py-1 rounded-full">
            {items?.length}
          </div>
        </Button>
      </div>
    </div>
  ) : null;
};

export default FloatingCart;
