'use client';

import { AnimatedCartButton } from '@/components/buttons/animated-cart-button';
import {
  AnimatedWishlistButton,
  type WishlistButtonState,
} from '@/components/buttons/animated-wishlist-button';
import { InstantBuyButton } from '@/components/instant-buy/instant-buy-button';
import {
  MakeOfferButton,
  OpenSeaOfferButton,
} from '@/components/search/make-offer-popover';
import { UserWalletAvatar } from '@/components/user-avatar';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { PasswordInput } from '@/components/password-input';
import { useCartRow } from '@/hooks/use-cart-row';
import { useWishlistRow } from '@/hooks/use-wishlist-row';
import { cn } from '@namefi-astra/ui/lib/cn';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import type { MlsSaleListing } from '@/lib/mls/feed';
import { BASE_MAINNET_CHAIN_ID } from '@/lib/marketplaces/chains';
import { buildOpenSeaAssetUrl } from '@/lib/marketplaces/opensea/constants';
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
import { toUnicodeDomainName } from '@namefi-astra/registrars/data/validations';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/data/multi-year-pricing';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
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

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Format an MLS feed listing's asking price for inline display, e.g. "$350.00".
// Returns undefined for missing or non-numeric values (e.g. "make offer").
function formatMlsAskingPrice(
  listing: MlsSaleListing | undefined,
): string | undefined {
  const raw = listing?.askingPrice?.trim();
  if (!raw) return undefined;
  const numeric = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  const currency = listing?.askingCurrency?.trim() || 'USD';
  return currency.toUpperCase() === 'USD'
    ? formatAmountInUSD(numeric)
    : `${numeric.toLocaleString('en-US')} ${currency}`;
}

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
  // Switches the surrounding search into Import mode for this taken-but-
  // importable domain. Wired by landings that support import; when omitted the
  // Import action is hidden (e.g. register-only PBN landings) so it is never a
  // dead button.
  onRequestImportMode?: () => void;
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
  onRequestImportMode,
  freeClaimEligibility,
}) => {
  const t = useTranslations('search');
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

  // For REGISTER operations only, treat the renewal price as the "original"
  // price when registration is cheaper (i.e., a first-year promotional discount).
  // Currency/unit: USD (whole dollars from computeChargesInUsdOrThrow).
  const originalRegistrationPriceInUsd = useMemo(() => {
    if (operationType !== itemTypeSchema.enum.REGISTER) {
      return undefined;
    }
    if (!isNotNil(priceInUsd) || !isNotNil(renewalPriceInUsd)) {
      return undefined;
    }
    return priceInUsd < renewalPriceInUsd ? renewalPriceInUsd : undefined;
  }, [operationType, priceInUsd, renewalPriceInUsd]);

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

  // A taken domain with an on-chain wallet owner is tokenized on Namefi (only
  // on-chain NFTs have a wallet owner). Such domains get the "On Namefi" owner
  // badge + an OpenSea make-offer, rather than the off-Namefi broker path.
  const ownerWallet =
    currentOwner && currentOwner.toLowerCase() !== ZERO_ADDRESS
      ? currentOwner
      : undefined;
  const isOnNamefi = Boolean(ownerWallet);
  const shortOwner = ownerWallet
    ? `${ownerWallet.substring(0, 6)}...${ownerWallet.substring(ownerWallet.length - 4)}`
    : '';
  const ownerGalleryHref = ownerWallet
    ? `/owner/${encodeURIComponent(ownerWallet)}`
    : undefined;
  // Default to Base mainnet — the canonical Namefi NFT chain — since the search
  // card doesn't carry a per-domain chain id.
  const openSeaOfferUrl = useMemo(
    () =>
      isOnNamefi && domain
        ? buildOpenSeaAssetUrl(domain, BASE_MAINNET_CHAIN_ID)
        : undefined,
    [isOnNamefi, domain],
  );

  // A domain present in the Namefi Feed (an aggregated sale post) shows its
  // asking price plus an "on Namefi feed" link to the per-domain feed page,
  // where the original source(s) can be found.
  const hasFeedListing = Boolean(mlsOffer && domain);
  const feedListingHref = hasFeedListing ? `/feed/${domain}` : undefined;
  const feedAskingPrice = formatMlsAskingPrice(mlsOffer);

  const shouldShowImportHint = Boolean(
    showImportUi && availabilityInfo?.availability,
  );
  const shouldShowImportInput = Boolean(
    isImportable && showImportUi && !availabilityInfo?.availability,
  );
  const domainLength = Array.from(displayDomain).length;
  const isLongDomain = domainLength > 28;
  const isVeryLongDomain = domainLength > 42;

  const namefiFeedLink = feedListingHref ? (
    <Link
      href={feedListingHref}
      aria-label={t('card.onFeedAriaLabel', { domain: displayDomain })}
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground sm:text-[11px]"
    >
      <span>{t('card.onFeedPrefix')}</span>
      <Image
        src="/logotype-mono.svg"
        alt="Namefi"
        width={48}
        height={13}
        className="h-2.5 w-auto opacity-80 sm:h-3"
      />
      <span>{t('card.onFeedSuffix')}</span>
    </Link>
  ) : null;

  return (
    <Card
      className={cn(
        'flex min-h-[116px] w-full items-stretch border-[1px] border-white/10 bg-white/5 p-0 backdrop-blur-lg transition-all duration-150 sm:min-h-[126px] md:min-h-[136px]',
        // Only dim domains we know are unavailable and not actionable (not
        // importable and not tokenized on Namefi).
        hasAvailabilityInfo &&
          !availabilityInfo.availability &&
          !isImportable &&
          !isOnNamefi
          ? 'opacity-60'
          : 'opacity-100',
      )}
    >
      <CardContent className="flex flex-1 items-center px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 md:py-4">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-4 md:gap-5">
          <div className="flex min-w-0 flex-col items-start justify-center gap-1.5 text-start">
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
              ) : !showImportUi && hasFeedListing ? (
                // Browse mode: a feed-listed domain shows the seller's asking
                // price + a link to the per-domain feed page. In Import mode the
                // import price takes precedence (handled below).
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-start">
                  {feedAskingPrice && (
                    <p className="line-clamp-1 text-sm font-medium sm:text-base md:text-xl">
                      {feedAskingPrice}
                    </p>
                  )}
                  {namefiFeedLink}
                </div>
              ) : !showImportUi &&
                isOnNamefi ? // Already owned on Namefi — no acquire price in browse mode.
              null : isNotNil(priceInUsd) ? (
                <div className="flex flex-col gap-0.5 text-start transition-opacity duration-200 ease-out">
                  <p className="line-clamp-2 text-sm font-medium sm:text-base md:text-xl sm:line-clamp-1">
                    <span
                      className={cn(
                        'font-semibold',
                        isNotNil(originalRegistrationPriceInUsd) &&
                          'text-brand-primary',
                      )}
                    >
                      {t('card.priceWithCurrency', {
                        price: formatAmountInUSD(priceInUsd),
                      })}
                    </span>
                    {isNotNil(originalRegistrationPriceInUsd) && (
                      <span className="ms-1.5 align-middle text-[10px] font-normal text-muted-foreground line-through sm:text-[11px] md:text-sm">
                        {formatAmountInUSD(originalRegistrationPriceInUsd)}
                      </span>
                    )}
                  </p>
                </div>
              ) : isUnsupported ? null : (
                <div className="flex flex-col gap-0.5 text-start invisible">
                  <p className="line-clamp-1 text-sm font-medium sm:text-base md:text-xl invisible">
                    {'N/A'}
                  </p>
                </div>
              )}
            </div>
            {isOnNamefi && ownerWallet && ownerGalleryHref && (
              <Link
                href={ownerGalleryHref}
                aria-label={t('card.onNamefiOwnerAriaLabel', {
                  owner: shortOwner,
                })}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:text-xs"
              >
                <span>{t('card.onNamefi')}</span>
                <Image
                  src="/logotype-mono.svg"
                  alt="Namefi"
                  width={48}
                  height={13}
                  className="h-3 w-auto opacity-90"
                />
                <UserWalletAvatar
                  address={ownerWallet}
                  className="size-4 ms-0.5"
                  imageSizes="16px"
                />
              </Link>
            )}
            {shouldShowImportHint && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] italic text-muted-foreground sm:text-xs">
                  {t('card.notRegistered')}
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
                    inWishlist
                      ? t('card.removeFromWishlist')
                      : t('card.addToWishlist')
                  }
                  onToggle={handleWishlistToggle}
                  disabled={wishlistBusy}
                  className={compactWishlistButtonClassName}
                />
              )}
              {shouldShowActionSkeleton ? (
                <Skeleton className="h-8 w-16 rounded-full bg-gray-600/50 sm:h-9 sm:w-20 md:w-24" />
              ) : isUnsupported ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {t('card.unsupported')}
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
                  <span className="sm:hidden">{t('card.lockedShort')}</span>
                  <span className="hidden sm:inline">
                    {t('card.temporarilyUnimportable')}
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
                </div>
              ) : !showImportUi &&
                hasAvailabilityInfo &&
                !availabilityInfo.availability &&
                !isAvailabilityAuthoritative ? (
                // The taken sub-state (On Namefi / importable / unavailable)
                // isn't reliable until the authoritative availability stream
                // arrives: preliminary lookup marks every taken name importable
                // and omits on-chain ownership. Skeleton instead of showing
                // premature broker / Import / OpenSea actions on a guess.
                <Skeleton className="h-8 w-16 rounded-full bg-gray-600/50 sm:h-9 sm:w-20 md:w-24" />
              ) : isOnNamefi && !showImportUi ? (
                openSeaOfferUrl ? (
                  <OpenSeaOfferButton href={openSeaOfferUrl} />
                ) : null
              ) : isImportable && !showImportUi ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  {domain && <MakeOfferButton domain={domain} />}
                  {onRequestImportMode && (
                    <Button
                      onClick={onRequestImportMode}
                      aria-label={t('card.importAriaLabel')}
                      className="h-8 max-w-full shrink-0 border border-white/15 bg-white/5 px-2.5 text-[11px] text-white hover:bg-white/10 sm:h-9 sm:px-3 sm:text-xs"
                    >
                      {t('card.import')}
                    </Button>
                  )}
                </div>
              ) : hasAvailabilityInfo &&
                !availabilityInfo.availability &&
                !isImportable ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  <span className="sm:hidden">
                    {t('card.unavailableShort')}
                  </span>
                  <span className="hidden sm:inline">
                    {t('card.temporarilyUnavailable')}
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
                  {t('card.freeClaim')}
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
                    hasStoredEncryptedEppCode
                      ? t('card.savedEppCode')
                      : t('card.eppCode')
                  }
                  placeholder={
                    hasStoredEncryptedEppCode
                      ? t('card.savedEppCode')
                      : t('card.eppCode')
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
