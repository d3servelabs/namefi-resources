'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import { CartItemDurationControl } from '@/components/cart-item-duration-stepper';
import { formatAmountInUSD } from '@/lib/number';
import { itemTypeSchema } from '@namefi-astra/contracts/shared-schemas';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Loader2, Trash2 } from 'lucide-react';
import { useCartRow } from '@/hooks/use-cart-row';
import type { UnifiedCartItem } from '@/hooks/use-cart';
import type { DomainAvailabilityInfo } from '@namefi-astra/contracts/domain-availability';
import { useCallback } from 'react';

interface CartItemProps {
  item: UnifiedCartItem;
  domainAvailabilityInfo?: DomainAvailabilityInfo;
  isDisabled: boolean;
  showSeparator: boolean;
  /**
   * When true, render even if the item is not currently in the cart.
   * Useful for pages that want the identical UI without affecting the cart.
   */
  forceRender?: boolean;
  /**
   * When true, hide destructive controls and disable edits.
   */
  readOnly?: boolean;
  /**
   * When provided, overrides the displayed amount while keeping layout identical.
   */
  overrideAmountInUSDCents?: number;
}

export function CartItem({
  item,
  domainAvailabilityInfo,
  isDisabled,
  showSeparator,
  forceRender,
  readOnly,
  overrideAmountInUSDCents,
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

  if (!inCart && !forceRender) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{item.normalizedDomainName}</span>
          {(item.type === itemTypeSchema.enum.IMPORT ||
            item.type === itemTypeSchema.enum.RENEW) && (
            <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-400/50">
              {item.type === itemTypeSchema.enum.IMPORT ? 'Import' : 'Renew'}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!readOnly ? (
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
            ) : null}
            <CartItemDurationControl
              item={item}
              domainAvailabilityInfo={domainAvailabilityInfo}
              onDurationChange={handleDurationChange}
              isDisabled={isDisabled || updatingBusy || !!readOnly}
            />
          </div>
          <span className="text-xl">
            {formatAmountInUSD(
              overrideAmountInUSDCents ?? item.amountInUSDCents,
              true,
            )}
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
