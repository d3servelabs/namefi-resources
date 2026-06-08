'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';
import { useFlag } from '@openfeature/react-sdk';
import { CartItemDurationControl } from '@/components/cart-item-duration-stepper';
import { CartItemSetupOptions } from '@/components/cart-item-setup-options';
import { formatAmountInUSD } from '@/lib/number';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/multi-year-pricing';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Loader2, Trash2 } from 'lucide-react';
import { useCartRow } from '@/hooks/use-cart-row';
import type { UnifiedCartItem } from '@/hooks/use-cart';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import { useCallback, useMemo } from 'react';

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

  const { value: setupOptionsEnabled } = useFlag(
    'cart-item-domain-setup-options',
    false,
  );

  const showSetupOptions =
    setupOptionsEnabled &&
    (item.type === itemTypeSchema.enum.REGISTER ||
      item.type === itemTypeSchema.enum.IMPORT);

  const displayName = useMemo(() => {
    try {
      return toUnicodeDomainName(item.normalizedDomainName);
    } catch {
      return item.normalizedDomainName;
    }
  }, [item.normalizedDomainName]);

  const isPunycode = displayName !== item.normalizedDomainName;

  const displayedAmountInUsdCents =
    overrideAmountInUSDCents ?? item.amountInUSDCents;

  // For REGISTER items, surface a "discount" indicator when the registration
  // total is lower than the equivalent renewal total for the same duration.
  // Currency: USD. Units: cents for displayed amounts; whole USD from
  // computeChargesInUsdOrThrow (converted to cents for comparison).
  const originalAmountInUsdCents = useMemo(() => {
    if (item.type !== itemTypeSchema.enum.REGISTER) {
      return undefined;
    }
    const renewalPrice = domainAvailabilityInfo?.pricingDetails?.renewalPrice;
    if (!renewalPrice) {
      return undefined;
    }
    try {
      const renewalTotalInCents = Math.round(
        computeChargesInUsdOrThrow(renewalPrice, item.durationInYears) * 100,
      );
      if (renewalTotalInCents <= displayedAmountInUsdCents) {
        return undefined;
      }
      return renewalTotalInCents;
    } catch {
      return undefined;
    }
  }, [
    item.type,
    item.durationInYears,
    domainAvailabilityInfo?.pricingDetails?.renewalPrice,
    displayedAmountInUsdCents,
  ]);

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
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xl">{displayName}</span>
            {(item.type === itemTypeSchema.enum.IMPORT ||
              item.type === itemTypeSchema.enum.RENEW) && (
              <Badge className="text-xs bg-blue-600/20 text-blue-400 border-blue-400/50">
                {item.type === itemTypeSchema.enum.IMPORT ? 'Import' : 'Renew'}
              </Badge>
            )}
          </div>
          {isPunycode && (
            <span className="text-sm text-muted-foreground">
              {item.normalizedDomainName}
            </span>
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
          {originalAmountInUsdCents !== undefined ? (
            <span className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatAmountInUSD(originalAmountInUsdCents, true)}
              </span>
              <span className="text-xl font-semibold text-brand-primary">
                {formatAmountInUSD(displayedAmountInUsdCents, true)}
              </span>
            </span>
          ) : (
            <span className="text-xl">
              {formatAmountInUSD(displayedAmountInUsdCents, true)}
            </span>
          )}
        </div>
        {showSetupOptions && (
          <CartItemSetupOptions item={item} readOnly={readOnly} />
        )}
      </div>
      {showSeparator && (
        <div className="my-6">
          <Separator />
        </div>
      )}
    </div>
  );
}
