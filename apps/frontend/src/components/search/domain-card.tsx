'use client';

import { AnimatedCartButton } from '@/components/buttons/animated-cart-button';
import {
  AnimatedWishlistButton,
  type WishlistButtonState,
} from '@/components/buttons/animated-wishlist-button';
import { InstantBuyButton } from '@/components/instant-buy';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { PasswordInput } from '@/components/password-input';
import { useCartRow } from '@/hooks/use-cart-row';
import { useWishlistRow } from '@/hooks/use-wishlist-row';
import { cn } from '@/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import type { MlsSaleListing } from '@/lib/mls/feed';
import { normalizeMlsHandle } from '@/lib/mls/handles';
import { formatAmountInUSD } from '@/lib/number';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  getDomainPricingForOperation,
  isDomainImportable,
  isDomainUnsupported,
  type DomainAvailabilityInfo,
} from '@namefi-astra/common/domain-availability';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/multi-year-pricing';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Gift, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isNotNil } from 'ramda';
import { useCallback, useMemo, useRef, type FC } from 'react';

// Progressive DomainCard that shows skeleton states for missing data
export const DomainCard: FC<{
  domain?: NamefiNormalizedDomain;
  availabilityInfo?: DomainAvailabilityInfo;
  mlsOffer?: MlsSaleListing;
  eppAuthorizationCode?: string;
  onEppCodeChange?: (eppCode: string) => void;
  isImportMode?: boolean;
  freeClaimEligibility?: {
    domain: string;
    eligible: boolean;
    eligibility: Array<{
      groupOrCampaignKey: string;
      claimsAvailable: number;
      hasExactMatch: boolean;
      hasParentMatch: boolean;
    }>;
  };
}> = ({
  domain,
  availabilityInfo,
  mlsOffer,
  eppAuthorizationCode,
  onEppCodeChange,
  isImportMode,
  freeClaimEligibility,
}) => {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();
  const eppInputRef = useRef<HTMLInputElement>(null);
  const showImportUi = Boolean(isImportMode);

  const logBeginCheckout = useCallback(() => {
    logEventWithInteractionLoggers({
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {},
    });
  }, [logEventWithInteractionLoggers]);

  // Only use cart functionality if we have a valid domain name
  const { cart, inCart, addingBusy, removingBusy } = useCartRow(domain);

  // Wishlist logic
  const { inWishlist, isBusy: wishlistBusy, wishlist } = useWishlistRow(domain);
  const wishlistState: WishlistButtonState = wishlistBusy
    ? inWishlist
      ? 'removing'
      : 'adding'
    : inWishlist
      ? 'wishlisted'
      : 'not-wishlisted';

  const handleWishlistToggle = async () => {
    if (!domain || wishlistBusy) return;
    if (inWishlist) {
      await wishlist.removeItem(domain);
    } else {
      await wishlist.addItem(domain);
    }
  };

  const cartItem = useMemo(() => {
    if (!domain || !inCart) return undefined;
    return cart.cartData?.find((item) => item.normalizedDomainName === domain);
  }, [cart, domain, inCart]);

  const cartItemEppAuthorizationCode = useMemo(() => {
    if (!cartItem) return undefined;
    return (
      cartItem.eppAuthorizationCode ?? cartItem.encryptedEppAuthorizationCode
    );
  }, [cartItem]);

  // Only calculate these if we have availabilityInfo
  const isImportable = availabilityInfo
    ? isDomainImportable(availabilityInfo)
    : false;
  const isUnsupported = availabilityInfo
    ? isDomainUnsupported(availabilityInfo)
    : false;

  // Get the appropriate pricing based on whether it's an import or registration
  const operationType = isImportable
    ? itemTypeSchema.enum.IMPORT
    : itemTypeSchema.enum.REGISTER;
  const pricingDetails = availabilityInfo
    ? getDomainPricingForOperation(availabilityInfo, operationType)
    : undefined;

  const priceInUsd = useMemo(() => {
    if (!pricingDetails) {
      return undefined;
    }
    return computeChargesInUsdOrThrow(pricingDetails, 1);
  }, [pricingDetails]);

  // Calculate renewal price for 1 year
  const renewalPriceInUsd = useMemo(() => {
    if (!availabilityInfo?.pricingDetails?.renewalPrice) {
      return undefined;
    }
    return computeChargesInUsdOrThrow(
      availabilityInfo.pricingDetails.renewalPrice,
      1,
    );
  }, [availabilityInfo?.pricingDetails?.renewalPrice]);

  // Split domain into subdomain and parent domain
  const parts = domain?.split('.');
  const subdomain = parts?.[0];
  const parentDomain = parts?.slice(1).join('.');

  const handleAdd = useCallback(async () => {
    if (!availabilityInfo) return;
    const minDuration = availabilityInfo.durationValidationInYears?.min ?? 1;
    await cart.addItem({
      domainAvailabilityInfo: availabilityInfo,
      durationInYears: minDuration,
      operationType: 'REGISTER',
    });
  }, [cart, availabilityInfo]);

  const handleRemove = useCallback(async () => {
    if (domain) {
      await cart.removeItem(domain);
    }
  }, [cart, domain]);

  const goToClaimPage = useCallback(() => {
    if (!domain) return;
    logBeginCheckout();
    router.push(`/claim/${domain}`);
  }, [domain, logBeginCheckout, router]);

  const hasAvailabilityInfo = availabilityInfo !== undefined;
  const shouldShowPricingSkeleton = !hasAvailabilityInfo;
  const shouldShowActionSkeleton = !hasAvailabilityInfo;
  const hasOwnerInfo =
    hasAvailabilityInfo &&
    !availabilityInfo.availability &&
    isNotNil(availabilityInfo.currentOwner);
  const currentOwner =
    hasOwnerInfo && availabilityInfo?.currentOwner
      ? availabilityInfo.currentOwner
      : '';
  const mlsSellerHandle = normalizeMlsHandle(mlsOffer?.seller.username ?? null);
  const mlsOfferUrl = mlsOffer?.sourceTweetUrl.trim() ?? '';
  const isUnavailableForDirectBuy = Boolean(
    availabilityInfo && !availabilityInfo.availability && !isUnsupported,
  );
  const shouldShowMlsOfferCta = Boolean(
    isUnavailableForDirectBuy && mlsSellerHandle && mlsOfferUrl.length,
  );
  const goToMlsOffer = useCallback(() => {
    if (!mlsOfferUrl) return;
    window.open(mlsOfferUrl, '_blank', 'noopener,noreferrer');
  }, [mlsOfferUrl]);

  return (
    <Card
      className={cn(
        'bg-white/5 backdrop-blur-lg h-[136px] pt-2 pb-4 transition-all duration-150 p-0 border-[1px] border-white/10',
        // Only reduce opacity if we know the domain is unavailable and not importable
        hasAvailabilityInfo && !availabilityInfo.availability && !isImportable
          ? 'opacity-60'
          : 'opacity-100',
      )}
    >
      <CardContent className="h-full w-full px-4 md:px-6">
        <div className="flex h-full w-full items-center justify-between">
          <div className="space-y-1 flex-1 min-w-0 mr-4 overflow-hidden">
            <div className="font-semibold tracking-tight flex items-center gap-2">
              <div className="min-w-0 flex-1">
                {domain ? (
                  <h3 className="line-clamp-2 break-words">
                    {subdomain && (
                      <span className="text-2xl md:text-3xl text-brand-tertiary">
                        {toUnicodeDomainName(subdomain)}
                      </span>
                    )}
                    {parentDomain && (
                      <span className="text-xl md:text-2xl text-foreground">
                        .{toUnicodeDomainName(parentDomain)}
                      </span>
                    )}
                  </h3>
                ) : (
                  <Skeleton className="h-8 w-full max-w-[250px] bg-gray-600/50" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {shouldShowPricingSkeleton ? (
                <Skeleton className="h-6 w-20 bg-gray-600/50" />
              ) : isNotNil(priceInUsd) ? (
                <div className="flex items-center gap-3 transition-opacity duration-200 ease-out">
                  <p className="text-sm md:text-xl shrink-0 font-medium line-clamp-1">
                    {`${formatAmountInUSD(priceInUsd)} USD`}
                  </p>
                  {isNotNil(renewalPriceInUsd) && (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      renews at {formatAmountInUSD(renewalPriceInUsd)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 invisible">
                  <p className="text-sm md:text-xl shrink-0 font-medium line-clamp-1 invisible">
                    {'N/A'}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground invisible">
                    {'N/A'}
                  </p>
                </div>
              )}
            </div>
            {hasOwnerInfo && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="mr-1 h-3 w-3 shrink-0" />
                <span className="line-clamp-1">
                  Owner: {currentOwner.substring(0, 6)}...
                  {currentOwner.substring(currentOwner.length - 4)}
                </span>
              </div>
            )}
            {showImportUi && availabilityInfo?.availability && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs md:text-sm text-muted-foreground italic">
                  Not registered
                </span>
              </div>
            )}
            {isImportable &&
              showImportUi &&
              !availabilityInfo?.availability && (
                <div className="flex items-center gap-2 mt-2 w-full md:w-80">
                  <PasswordInput
                    ref={eppInputRef}
                    placeholder="EPP Auth Code"
                    value={
                      inCart
                        ? (cartItemEppAuthorizationCode ?? '')
                        : (eppAuthorizationCode ?? '')
                    }
                    disabled={inCart}
                    onChange={(e) => onEppCodeChange?.(e.target.value)}
                    className="h-8 text-xs md:text-sm bg-gray-700/50 border-gray-600"
                  />
                </div>
              )}
          </div>
          <div className="flex shrink-0 items-center justify-center gap-2">
            {domain && (
              <AnimatedWishlistButton
                state={wishlistState}
                aria-label={
                  inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
                }
                onToggle={handleWishlistToggle}
                disabled={wishlistBusy}
              />
            )}
            {shouldShowActionSkeleton ? (
              <Skeleton className="h-10 w-[120px] rounded-full bg-gray-600/50" />
            ) : isUnsupported ? (
              <Badge variant="destructive" className="text-xs">
                Unsupported
              </Badge>
            ) : showImportUi && availabilityInfo?.availability ? (
              <div className="flex items-center gap-2">
                <AnimatedCartButton
                  state={
                    removingBusy
                      ? 'removing'
                      : addingBusy
                        ? 'adding'
                        : inCart
                          ? 'in-cart'
                          : 'add-to-cart'
                  }
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  onGoToCart={() => {
                    logBeginCheckout();
                    router.push('/cart');
                  }}
                  showRemoveButton={inCart}
                  disabled={addingBusy || removingBusy}
                />
              </div>
            ) : showImportUi && !isImportable ? (
              <Badge variant="secondary" className="text-xs">
                Temporarily unimportable
              </Badge>
            ) : showImportUi && isImportable ? null : isImportable &&
              !showImportUi ? (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Taken
                </Badge>
                {shouldShowMlsOfferCta && (
                  <Button
                    onClick={goToMlsOffer}
                    className="shrink-0 bg-sky-500 text-white hover:bg-sky-400 md:w-44"
                  >
                    <span className="inline-flex items-center gap-1 md:hidden">
                      <span>Buy on</span>
                      <Image
                        src="/assets/social/twitter.svg"
                        alt="X"
                        width={14}
                        height={14}
                        className="size-3.5 shrink-0"
                      />
                    </span>
                    <span className="hidden items-center gap-2 md:inline-flex">
                      <span>Buy from</span>
                      <span className="inline-flex max-w-20 items-center gap-1 rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[11px] leading-none text-white">
                        <span className="font-semibold">X</span>
                        <span className="truncate">{mlsSellerHandle}</span>
                      </span>
                    </span>
                  </Button>
                )}
              </div>
            ) : hasAvailabilityInfo &&
              !availabilityInfo.availability &&
              !isImportable ? (
              <Badge variant="secondary" className="text-xs">
                Temporarily unavailable
              </Badge>
            ) : availabilityInfo.availability &&
              freeClaimEligibility?.eligible ? (
              <NamefiButton
                onClick={goToClaimPage}
                className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
              >
                <Gift className="h-4 w-4" />
                Free Claim
              </NamefiButton>
            ) : availabilityInfo.availability ? (
              <div className="flex items-center gap-2">
                <AnimatedCartButton
                  state={
                    removingBusy
                      ? 'removing'
                      : addingBusy
                        ? 'adding'
                        : inCart
                          ? 'in-cart'
                          : 'add-to-cart'
                  }
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  onGoToCart={() => {
                    logBeginCheckout();
                    router.push('/cart');
                  }}
                  showRemoveButton={inCart}
                  disabled={addingBusy || removingBusy}
                />
                <InstantBuyButton
                  domainAvailabilityInfo={availabilityInfo}
                  disabled={addingBusy || removingBusy}
                />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <DomainCard key={`skeleton-${index}`} />
    ))}
  </div>
);
