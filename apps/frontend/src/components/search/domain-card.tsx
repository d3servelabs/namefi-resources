'use client';

import { AnimatedCartButton } from '@/components/buttons/animated-cart-button';
import {
  AnimatedWishlistButton,
  type WishlistButtonState,
} from '@/components/buttons/animated-wishlist-button';
import { InstantBuyButton } from '@/components/instant-buy';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { PasswordInput } from '@/components/password-input';
import { useCartRow } from '@/hooks/use-cart-row';
import { useWishlistRow } from '@/hooks/use-wishlist-row';
import { cn } from '@namefi-astra/ui/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import type { MlsSaleListing } from '@/lib/mls/feed';
import { normalizeMlsHandle } from '@/lib/mls/handles';
import { formatAmountInUSD } from '@/lib/number';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';

// Progressive DomainCard that shows skeleton states for missing data
function truncateMiddle(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value;
  }

  const ellipsis = '...';
  const visibleChars = Math.max(maxChars - ellipsis.length, 2);
  const headChars = Math.ceil(visibleChars / 2);
  const tailChars = Math.floor(visibleChars / 2);

  return `${value.slice(0, headChars)}${ellipsis}${value.slice(-tailChars)}`;
}

const MIN_SUBDOMAIN_CHARS = 10;

const DomainTitle: FC<{
  domain: string;
  subdomain: string | null;
  parentDomain: string | null;
  subdomainClassName: string;
  parentDomainClassName: string;
}> = ({
  domain,
  subdomain,
  parentDomain,
  subdomainClassName,
  parentDomainClassName,
}) => {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const visibleTextRef = useRef<HTMLSpanElement>(null);
  const visibleSubdomainRef = useRef<HTMLSpanElement>(null);
  const visibleParentDomainRef = useRef<HTMLSpanElement>(null);
  const measureRootRef = useRef<HTMLSpanElement>(null);
  const measureSubdomainRef = useRef<HTMLSpanElement>(null);
  const [displaySubdomain, setDisplaySubdomain] = useState(subdomain ?? '');

  const recomputeDisplaySubdomain = useCallback(() => {
    if (!subdomain) {
      setDisplaySubdomain('');
      return;
    }

    if (
      !visibleTextRef.current ||
      !measureRootRef.current ||
      !measureSubdomainRef.current
    ) {
      return;
    }

    const measureRoot = measureRootRef.current;
    const measureSubdomain = measureSubdomainRef.current;
    const subdomainStyle = visibleSubdomainRef.current
      ? window.getComputedStyle(visibleSubdomainRef.current)
      : null;
    const parentDomainStyle = visibleParentDomainRef.current
      ? window.getComputedStyle(visibleParentDomainRef.current)
      : null;
    const resolvedLineHeights = [subdomainStyle, parentDomainStyle]
      .filter((style): style is CSSStyleDeclaration => Boolean(style))
      .map((style) => {
        const parsedLineHeight = Number.parseFloat(style.lineHeight);
        if (Number.isFinite(parsedLineHeight)) {
          return parsedLineHeight;
        }

        return Number.parseFloat(style.fontSize) * 1.1;
      });
    const lineHeight = Math.max(...resolvedLineHeights, 0);
    const maxHeight = lineHeight * 2 + 1;

    const doesFit = (candidate: string) => {
      measureSubdomain.textContent = candidate;
      return measureRoot.getBoundingClientRect().height <= maxHeight;
    };

    if (doesFit(subdomain)) {
      setDisplaySubdomain(subdomain);
      return;
    }

    let low = Math.min(MIN_SUBDOMAIN_CHARS, subdomain.length);
    let high = subdomain.length;
    let bestFit = truncateMiddle(subdomain, low);

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidate = truncateMiddle(subdomain, mid);

      if (doesFit(candidate)) {
        bestFit = candidate;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    setDisplaySubdomain(bestFit);
  }, [subdomain]);

  useEffect(() => {
    recomputeDisplaySubdomain();

    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      recomputeDisplaySubdomain();
    });

    resizeObserver.observe(wrapper, { box: 'border-box' });

    return () => {
      resizeObserver.disconnect();
    };
  }, [recomputeDisplaySubdomain]);

  return (
    <h3 className="min-w-0 leading-[1.06]" title={domain}>
      <span ref={wrapperRef} className="relative block w-full">
        <span
          ref={visibleTextRef}
          className="line-clamp-2 block w-full break-words [overflow-wrap:anywhere]"
        >
          {displaySubdomain && (
            <span ref={visibleSubdomainRef} className={subdomainClassName}>
              {displaySubdomain}
            </span>
          )}
          {parentDomain && (
            <span
              ref={visibleParentDomainRef}
              className={parentDomainClassName}
            >
              {displaySubdomain ? '.' : ''}
              {parentDomain}
            </span>
          )}
        </span>
        <span
          ref={measureRootRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 invisible block w-full break-words [overflow-wrap:anywhere]"
        >
          {subdomain && (
            <span ref={measureSubdomainRef} className={subdomainClassName}>
              {displaySubdomain}
            </span>
          )}
          {parentDomain && (
            <span className={parentDomainClassName}>
              {subdomain ? '.' : ''}
              {parentDomain}
            </span>
          )}
        </span>
      </span>
    </h3>
  );
};

export const DomainCard: FC<{
  domain?: NamefiNormalizedDomain;
  availabilityInfo?: DomainAvailabilityInfo;
  isAvailabilityAuthoritative?: boolean;
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
  isAvailabilityAuthoritative = true,
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

  const cartItemPlaintextEppAuthorizationCode =
    cartItem?.eppAuthorizationCode?.trim();
  const hasStoredEncryptedEppCode = Boolean(
    inCart &&
      cartItem?.encryptedEppAuthorizationCode &&
      !cartItemPlaintextEppAuthorizationCode,
  );
  const activeEppAuthorizationCode = (
    inCart ? cartItemPlaintextEppAuthorizationCode : eppAuthorizationCode
  )?.trim();

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
  const unicodeSubdomain = subdomain ? toUnicodeDomainName(subdomain) : null;
  const unicodeParentDomain = parentDomain
    ? toUnicodeDomainName(parentDomain)
    : null;
  const displayDomain =
    [unicodeSubdomain, unicodeParentDomain].filter(isNotNil).join('.') ||
    domain ||
    '';
  const isImportAction =
    showImportUi && isImportable && !availabilityInfo?.availability;
  const isWaitingForAuthoritativeAvailability = Boolean(
    availabilityInfo && !isAvailabilityAuthoritative,
  );
  const cartButtonState = removingBusy
    ? 'removing'
    : addingBusy
      ? 'adding'
      : inCart
        ? 'in-cart'
        : isImportAction
          ? 'import'
          : 'add-to-cart';
  const isImportButtonDisabled =
    isImportAction && !inCart && !activeEppAuthorizationCode;
  const importButtonClassName = isImportButtonDisabled
    ? 'bg-brand-primary/45 text-primary-foreground/70 hover:bg-brand-primary/45'
    : undefined;
  const compactCartButtonClassName =
    'size-8 sm:size-9 md:h-9 md:w-auto md:px-3 md:text-xs';
  const compactWishlistButtonClassName =
    'size-8 [&_svg]:h-4 [&_svg]:w-4 sm:size-9 sm:[&_svg]:h-5 sm:[&_svg]:w-5';

  const handleAdd = useCallback(async () => {
    if (!availabilityInfo) return;
    // Cart rows can be created from preliminary search data; cart/checkout
    // validation refreshes authoritative availability before purchase.
    if (isImportAction && !activeEppAuthorizationCode) {
      eppInputRef.current?.focus();
      return;
    }
    const minDuration = Math.max(
      1,
      availabilityInfo.durationValidationInYears?.min ?? 1,
    );
    await cart.addItem({
      domainAvailabilityInfo: availabilityInfo,
      durationInYears: minDuration,
      operationType: isImportAction ? 'IMPORT' : 'REGISTER',
      ...(isImportAction
        ? { eppAuthorizationCode: activeEppAuthorizationCode }
        : {}),
    });
  }, [activeEppAuthorizationCode, availabilityInfo, cart, isImportAction]);

  const handleRemove = useCallback(async () => {
    if (domain) {
      await cart.removeItem(domain);
    }
  }, [cart, domain]);

  const goToCart = useCallback(() => {
    logBeginCheckout();
    router.push('/cart');
  }, [logBeginCheckout, router]);

  const goToClaimPage = useCallback(() => {
    if (!domain) return;
    if (!isAvailabilityAuthoritative) return;
    logBeginCheckout();
    router.push(`/claim/${domain}`);
  }, [domain, isAvailabilityAuthoritative, logBeginCheckout, router]);

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
  const shouldShowImportHint = Boolean(
    showImportUi && availabilityInfo?.availability,
  );
  const shouldShowImportInput = Boolean(
    isImportable && showImportUi && !availabilityInfo?.availability,
  );
  const domainLength = Array.from(displayDomain).length;
  const isLongDomain = domainLength > 28;
  const isVeryLongDomain = domainLength > 42;
  const goToMlsOffer = useCallback(() => {
    if (!mlsOfferUrl) return;
    window.open(mlsOfferUrl, '_blank', 'noopener,noreferrer');
  }, [mlsOfferUrl]);
  const mlsOfferButton = shouldShowMlsOfferCta ? (
    <Button
      onClick={goToMlsOffer}
      aria-label={
        mlsSellerHandle ? `Buy on X from ${mlsSellerHandle}` : 'Buy on X'
      }
      className="h-8 max-w-full shrink-0 gap-1.5 border border-white/15 bg-black px-2.5 text-[11px] text-white shadow-sm hover:bg-zinc-900 hover:text-white sm:h-9 sm:px-3 sm:text-xs"
    >
      <span className="sm:hidden">Buy</span>
      <span className="hidden sm:inline">Buy on</span>
      <Image
        src="/assets/social/x-logo.svg"
        alt="X"
        width={12}
        height={12}
        className="size-3 shrink-0"
      />
    </Button>
  ) : null;

  return (
    <Card
      className={cn(
        'flex min-h-[116px] w-full items-stretch border-[1px] border-white/10 bg-white/5 p-0 backdrop-blur-lg transition-all duration-150 sm:min-h-[126px] md:min-h-[136px]',
        // Only reduce opacity if we know the domain is unavailable and not importable
        hasAvailabilityInfo && !availabilityInfo.availability && !isImportable
          ? 'opacity-60'
          : 'opacity-100',
      )}
    >
      <CardContent className="flex flex-1 items-center px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 md:py-4">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-4 md:gap-5">
          <div className="flex min-w-0 flex-col items-start justify-center gap-1.5 text-left">
            <div className="font-semibold tracking-tight w-full">
              <div className="min-w-0">
                {domain ? (
                  <DomainTitle
                    domain={domain}
                    subdomain={unicodeSubdomain}
                    parentDomain={unicodeParentDomain}
                    subdomainClassName={cn(
                      'text-brand-tertiary',
                      isVeryLongDomain
                        ? 'text-[0.95rem] sm:text-[1.05rem] md:text-[1.35rem]'
                        : isLongDomain
                          ? 'text-[1.05rem] sm:text-[1.15rem] md:text-[1.5rem]'
                          : 'text-lg sm:text-xl md:text-[1.8rem]',
                    )}
                    parentDomainClassName={cn(
                      'text-foreground',
                      isVeryLongDomain
                        ? 'text-[0.85rem] sm:text-[0.95rem] md:text-[1.25rem]'
                        : isLongDomain
                          ? 'text-[0.95rem] sm:text-[1rem] md:text-[1.35rem]'
                          : 'text-base sm:text-lg md:text-[1.55rem]',
                    )}
                  />
                ) : (
                  <Skeleton className="h-8 w-full max-w-[250px] bg-gray-600/50" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {shouldShowPricingSkeleton ? (
                <Skeleton className="h-5 w-16 bg-gray-600/50 sm:h-6 sm:w-20" />
              ) : isNotNil(priceInUsd) ? (
                <div className="flex flex-col gap-0.5 text-left transition-opacity duration-200 ease-out">
                  <p className="line-clamp-1 text-sm font-medium sm:text-base md:text-xl">
                    {`${formatAmountInUSD(priceInUsd)} USD`}
                  </p>
                  {isNotNil(renewalPriceInUsd) && (
                    <p className="text-[10px] text-muted-foreground sm:text-[11px] md:text-sm">
                      renews at {formatAmountInUSD(renewalPriceInUsd)}
                    </p>
                  )}
                </div>
              ) : isUnsupported ? null : (
                <div className="flex flex-col gap-0.5 text-left invisible">
                  <p className="line-clamp-1 text-sm font-medium sm:text-base md:text-xl invisible">
                    {'N/A'}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-[11px] md:text-sm invisible">
                    {'N/A'}
                  </p>
                </div>
              )}
            </div>
            {hasOwnerInfo && (
              <div className="flex items-center text-[11px] text-muted-foreground sm:text-xs">
                <User className="mr-1 h-3 w-3 shrink-0" />
                <span className="line-clamp-1">
                  Owner: {currentOwner.substring(0, 6)}...
                  {currentOwner.substring(currentOwner.length - 4)}
                </span>
              </div>
            )}
            {shouldShowImportHint && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] italic text-muted-foreground sm:text-xs">
                  Not registered
                </span>
              </div>
            )}
          </div>
          <div className="flex w-[8.25rem] shrink-0 flex-col items-end justify-center gap-2 sm:w-[9rem] sm:gap-2.5 md:min-w-[14rem] md:w-max">
            <div className="flex w-full flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
              {domain && (
                <AnimatedWishlistButton
                  state={wishlistState}
                  aria-label={
                    inWishlist ? 'Remove from wishlist' : 'Add to wishlist'
                  }
                  onToggle={handleWishlistToggle}
                  disabled={wishlistBusy}
                  className={compactWishlistButtonClassName}
                />
              )}
              {shouldShowActionSkeleton ? (
                <Skeleton className="h-8 w-16 rounded-full bg-gray-600/50 sm:h-9 sm:w-20 md:w-24" />
              ) : isUnsupported ? (
                <Badge variant="destructive" className="text-[10px] sm:text-xs">
                  Unsupported
                </Badge>
              ) : showImportUi && availabilityInfo?.availability ? (
                <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
                  <AnimatedCartButton
                    state={cartButtonState}
                    className={compactCartButtonClassName}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    onGoToCart={goToCart}
                    showRemoveButton={inCart}
                    disabled={addingBusy || removingBusy}
                  />
                </div>
              ) : showImportUi && !isImportable ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  <span className="sm:hidden">Locked</span>
                  <span className="hidden sm:inline">
                    Temporarily unimportable
                  </span>
                </Badge>
              ) : showImportUi && isImportable ? (
                <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
                  <AnimatedCartButton
                    state={cartButtonState}
                    className={cn(
                      compactCartButtonClassName,
                      importButtonClassName,
                    )}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    onGoToCart={goToCart}
                    showRemoveButton={inCart}
                    disabled={
                      addingBusy || removingBusy || isImportButtonDisabled
                    }
                  />
                  {mlsOfferButton}
                </div>
              ) : isImportable && !showImportUi ? (
                <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
                  <Badge
                    variant="destructive"
                    className="text-[10px] sm:text-xs"
                  >
                    Taken
                  </Badge>
                  {mlsOfferButton}
                </div>
              ) : hasAvailabilityInfo &&
                !availabilityInfo.availability &&
                !isImportable ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  <span className="sm:hidden">Unavailable</span>
                  <span className="hidden sm:inline">
                    Temporarily unavailable
                  </span>
                </Badge>
              ) : availabilityInfo.availability &&
                freeClaimEligibility?.eligible ? (
                <NamefiButton
                  onClick={goToClaimPage}
                  disabled={isWaitingForAuthoritativeAvailability}
                  aria-busy={isWaitingForAuthoritativeAvailability}
                  className="h-8 max-w-full px-3 text-[11px] bg-brand-primary text-primary-foreground hover:bg-brand-primary/90 sm:h-9 sm:text-xs disabled:opacity-100"
                >
                  <Gift className="h-4 w-4" />
                  Free Claim
                </NamefiButton>
              ) : availabilityInfo.availability ? (
                <div className="flex flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
                  <AnimatedCartButton
                    state={cartButtonState}
                    className={compactCartButtonClassName}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                    onGoToCart={goToCart}
                    showRemoveButton={inCart}
                    disabled={addingBusy || removingBusy}
                  />
                  <InstantBuyButton
                    domainAvailabilityInfo={availabilityInfo}
                    disabled={
                      addingBusy ||
                      removingBusy ||
                      isWaitingForAuthoritativeAvailability
                    }
                    className="h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-xs disabled:opacity-100"
                  />
                </div>
              ) : null}
            </div>
            {shouldShowImportInput && (
              <div className="w-full">
                <PasswordInput
                  ref={eppInputRef}
                  aria-label={
                    hasStoredEncryptedEppCode ? 'Saved EPP code' : 'EPP Code'
                  }
                  placeholder={
                    hasStoredEncryptedEppCode ? 'Saved EPP code' : 'EPP Code'
                  }
                  value={activeEppAuthorizationCode ?? ''}
                  disabled={inCart}
                  onChange={(e) => onEppCodeChange?.(e.target.value)}
                  className="h-8 w-full border-gray-600 bg-gray-700/50 text-[11px] sm:h-9 sm:text-xs md:text-sm"
                />
              </div>
            )}
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
