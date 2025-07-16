'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import { CartItemDurationControl } from '@/components/cart-item-duration-stepper';
import { formatAmountInUSD } from '@/utils/number';
import { itemTypeSchema } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { Loader2, Trash2 } from 'lucide-react';
import { useCartRow } from '@/hooks/use-cart-row';
import type { UnifiedCartItem } from '@/hooks/use-cart';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';
import { useCallback } from 'react';

interface CartItemProps {
  item: UnifiedCartItem;
  domainAvailabilityInfo?: DomainAvailabilityInfo;
  isDisabled: boolean;
  showSeparator: boolean;
}

export function CartItem({
  item,
  domainAvailabilityInfo,
  isDisabled,
  showSeparator,
}: CartItemProps) {
  const { cart, inCart, removingBusy, updatingBusy } = useCartRow(
    item.normalizedDomainName,
  );

  const handleDurationChange = useCallback(
    async (itemId: string, newDuration: number) => {
      if (domainAvailabilityInfo) {
        try {
          await cart.updateItem({
            id: itemId,
            durationInYears: newDuration,
            domainAvailabilityInfo: domainAvailabilityInfo,
          });
        } catch (error) {
          console.error('Failed to update cart item duration:', error);
        }
      }
    },
    [cart.updateItem, domainAvailabilityInfo],
  );

  const handleRemoveItem = useCallback(
    async (domainName: NamefiNormalizedDomain) => {
      await cart.removeItem([domainName]);
    },
    [cart.removeItem],
  );

  if (!inCart) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{item.normalizedDomainName}</span>
          {(item.type === itemTypeSchema.Values.IMPORT ||
            item.type === itemTypeSchema.Values.RENEW) && (
            <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-400/50">
              {item.type === itemTypeSchema.Values.IMPORT ? 'Import' : 'Renew'}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleRemoveItem(item.normalizedDomainName)}
              disabled={isDisabled || removingBusy}
            >
              {removingBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
            <CartItemDurationControl
              item={item}
              domainAvailabilityInfo={domainAvailabilityInfo}
              onDurationChange={handleDurationChange}
              isDisabled={isDisabled || updatingBusy}
            />
          </div>
          <span className="text-xl">
            {formatAmountInUSD(item.amountInUSDCents, true)}
          </span>
        </div>
      </div>
      {showSeparator && (
        <div className="my-6">
          <Separator />
        </div>
      )}
    </div>
  );
}
