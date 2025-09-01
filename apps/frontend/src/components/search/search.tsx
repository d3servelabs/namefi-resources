'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/shadcn/tooltip';
import { PasswordInput } from '@/components/password-input';
import { useCartRow } from '@/hooks/use-cart-row';
import { config } from '@/lib/env';
import { cn } from '@/lib/cn';
import {
  type BeginCheckoutEvent,
  InteractionLoggingEventName,
} from '@/lib/analytics-events';
import { formatAmountInUSD } from '@/lib/number';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/multi-year-pricing';
import { Loader2, SearchIcon, User, X, Gift } from 'lucide-react';
import { useWishlistRow } from '@/hooks/use-wishlist-row';
import {
  AnimatedWishlistButton,
  type WishlistButtonState,
} from '../buttons/animated-wishlist-button';
import { useRouter } from 'next/navigation';
import { isNotNil } from 'ramda';
import {
  type FC,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
} from 'react';
import { NamefiButton } from '../buttons/namefi-button';
import { AnimatedCartButton } from '../buttons/animated-cart-button';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { Placeholder } from './placeholder';
import type { ImportQuery } from './types';
import {
  isDomainImportable,
  isDomainUnsupported,
  getDomainPricingForOperation,
  type DomainAvailabilityInfo,
} from '@namefi-astra/backend/trpc/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { itemTypeSchema } from '@namefi-astra/db/types';
import { toUnicodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { SearchMode } from './types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Separator } from '@/components/ui/shadcn/separator';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { Spotlight } from '@/components/ui/spotlight';

// Components
export const SearchHeader: FC<{
  parentDomain: string | undefined;
  setParentDomain: (domain: string | undefined) => void;
  isFirstPartyOrigin: boolean;
  tagline?: string;
  hideNetworkSelection?: boolean;
  className?: string;
}> = ({
  parentDomain,
  setParentDomain,
  isFirstPartyOrigin,
  tagline,
  hideNetworkSelection = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center mt-40 gap-3', className)}>
      <p className="text-4xl text-center text-secondary-foreground font-semibold drop-shadow-xl">
        {tagline || `Search for a domain on ${parentDomain ?? 'all networks'}`}
      </p>
      {isFirstPartyOrigin && !hideNetworkSelection && (
        <div className="flex gap-2 p-3 pr-0 items-center bg-neutral-900 backdrop-blur-md rounded-lg">
          Network:
          <div className="flex items-center gap-2 mx-auto w-full max-w-md overflow-x-auto">
            <Button
              key="main"
              variant={parentDomain === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setParentDomain(undefined)}
              className="h-8 px-3"
            >
              All
            </Button>
            {config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.map((origin) => (
              <Button
                key={origin}
                variant={parentDomain === origin ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParentDomain(origin)}
                className="h-8 px-3"
              >
                {origin}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SearchModeTabs: FC<{
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
}> = ({ searchMode, onSearchModeChange }) => {
  const handleValueChange = (value: string) => {
    onSearchModeChange(value as SearchMode);
  };

  return (
    <Tabs
      value={searchMode}
      onValueChange={handleValueChange}
      className="w-full max-w-100 h-14 mx-auto"
    >
      <TabsList className="grid w-full h-full grid-cols-2 bg-neutral-900 backdrop-blur-md">
        <TabsTrigger
          value={SearchMode.REGISTER}
          className="h-full text-lg font-medium data-[state=active]:bg-background data-[state=inactive]:text-muted-foreground"
        >
          Register
        </TabsTrigger>
        <TabsTrigger
          value={SearchMode.IMPORT}
          className="h-full text-lg font-medium data-[state=active]:bg-background data-[state=inactive]:text-muted-foreground"
        >
          Import
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export const SearchInput: FC<{
  query: string;
  setQuery: (query: string) => void;
  importQuery: Map<NamefiNormalizedDomain, ImportQuery>;
  isLoading: boolean;
  onSearch: () => void;
  searchMode: SearchMode;
  parentDomain: string | undefined;
  onClearParentDomain?: () => void;
  isFirstPartyOrigin?: boolean;
}> = ({
  query,
  setQuery,
  importQuery,
  isLoading,
  searchMode,
  onSearch,
  parentDomain,
  onClearParentDomain,
  isFirstPartyOrigin,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerFocusSearchInput, registerFreeMintsGuidanceStarter } =
    useFreeMintsGuidance();
  const [isFreeMintGuidanceVisible, setIsFreeMintGuidanceVisible] =
    useState(false);

  const displayFreeMintTooltip = useCallback(() => {
    setIsFreeMintGuidanceVisible(true);
    // Auto-hide tooltip after 5 seconds
    setTimeout(() => {
      setIsFreeMintGuidanceVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    registerFreeMintsGuidanceStarter(displayFreeMintTooltip);
  }, [registerFreeMintsGuidanceStarter, displayFreeMintTooltip]);

  const clearParentDomainAndDismissFreeMintGuidance = useCallback(() => {
    setIsFreeMintGuidanceVisible(false);
    onClearParentDomain?.();
  }, [onClearParentDomain]);

  const handleSearchClick = useCallback(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      // If no query, focus the input
      inputRef.current?.focus();
    } else {
      // Handle search
      onSearch();
    }
  }, [query, onSearch]);

  // Handle raw text with newlines for CSV import
  const handleRawText = useCallback(
    (rawText: string) => {
      // For import mode, preserve newlines to maintain CSV format
      if (searchMode === SearchMode.IMPORT) {
        setQuery(rawText);
      } else {
        // For register mode, convert newlines to spaces
        setQuery(rawText.replace(/\n+/g, ' '));
      }
    },
    [searchMode, setQuery],
  );
  // Expose focus method for other components (e.g., free mint claim)
  useEffect(() => {
    registerFocusSearchInput(() => inputRef.current?.focus());
  }, [registerFocusSearchInput]);

  // Intercept paste and input events to handle newlines properly
  const intercept = useCallback(
    (e: ClipboardEvent<HTMLInputElement> | FormEvent<HTMLInputElement>) => {
      e.preventDefault();

      const raw =
        (e as ClipboardEvent<HTMLInputElement>).clipboardData?.getData(
          'text',
        ) ??
        (e as FormEvent<HTMLInputElement>).currentTarget?.value ??
        '';

      handleRawText(raw);
    },
    [handleRawText],
  );

  return (
    <>
      <Tooltip open={isFreeMintGuidanceVisible}>
        <TooltipTrigger asChild>
          <div
            ref={containerRef}
            className="flex w-full max-w-3xl mx-auto gap-1 items-center bg-neutral-900 backdrop-blur-lg border border-neutral-800 rounded-lg p-3"
          >
            <div className="flex items-center flex-1 overflow-hidden rounded-lg">
              <div className="relative w-full rounded-md h-12 flex items-center">
                <div className="flex items-center w-full h-full px-3">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-gray-400 shrink-0 animate-spin" />
                  ) : searchMode === SearchMode.IMPORT ? (
                    <SearchIcon className="h-5 w-5 text-gray-400 shrink-0" />
                  ) : (
                    <SearchIcon className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                  <Input
                    ref={inputRef}
                    name="search-input"
                    placeholder={
                      searchMode === SearchMode.IMPORT
                        ? 'Paste CSV to import domains...'
                        : 'Search for a domain...'
                    }
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onPaste={intercept}
                    onKeyDown={(e) => {
                      // Only intercept newline insertion; ordinary keystrokes can proceed
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRawText('\n');
                      }
                    }}
                    className="border-0 dark:bg-transparent h-full focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 flex-1 md:text-lg shadow-none"
                  />
                  {query.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md p-0 ml-1 shrink-0"
                      onClick={() => setQuery('')}
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </Button>
                  )}
                  {isFirstPartyOrigin &&
                    searchMode === SearchMode.REGISTER &&
                    parentDomain && (
                      <div className="mx-2 h-full flex items-stretch">
                        <Separator
                          orientation="vertical"
                          className="bg-neutral-800"
                        />
                      </div>
                    )}
                  <AnimatePresence initial={false} mode="popLayout">
                    {isFirstPartyOrigin &&
                      searchMode === SearchMode.REGISTER &&
                      parentDomain && (
                        <motion.div
                          key="parent-domain-pill"
                          initial={{ opacity: 0, x: 16 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                            transition: { duration: 0.22, ease: 'easeOut' },
                          }}
                          exit={{
                            opacity: 0,
                            x: 16,
                            transition: { duration: 0.18, ease: 'easeIn' },
                          }}
                          className="flex items-center"
                          layout
                          transition={{
                            layout: {
                              type: 'tween',
                              duration: 0.22,
                              ease: 'easeOut',
                            },
                          }}
                        >
                          <div className="relative">
                            <Badge
                              variant="secondary"
                              className="h-8 px-3 py-0.5 text-sm flex items-center"
                            >
                              <AnimatePresence initial={false} mode="wait">
                                <motion.span
                                  key={parentDomain}
                                  initial={{ opacity: 0 }}
                                  animate={{
                                    opacity: 1,
                                    transition: {
                                      duration: 0.15,
                                      ease: 'easeOut',
                                    },
                                  }}
                                  exit={{
                                    opacity: 0,
                                    transition: {
                                      duration: 0.12,
                                      ease: 'easeIn',
                                    },
                                  }}
                                  className="max-w-[200px] truncate whitespace-nowrap"
                                >
                                  .{parentDomain}
                                </motion.span>
                              </AnimatePresence>
                            </Badge>
                            {onClearParentDomain && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Clear parent domain"
                                onClick={
                                  clearParentDomainAndDismissFreeMintGuidance
                                }
                                className="absolute -top-2 -right-2 size-5 rounded-full bg-neutral-800 border cursor-pointer border-neutral-700 flex items-center justify-center hover:bg-neutral-700!"
                              >
                                <X className="size-3" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <NamefiButton
              onClick={handleSearchClick}
              className="not-only:font-semibold rounded-md h-12 text-lg w-[128px] transition-all duration-200 shrink-0"
              title={searchMode === SearchMode.IMPORT ? 'Import' : 'Search'}
            >
              {searchMode === SearchMode.IMPORT ? 'Import' : 'Search'}
            </NamefiButton>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          sideOffset={10}
          className="max-w-xs text-wrap text-center text-sm p-2 z-[10000]"
        >
          <p>
            Search for available{' '}
            {parentDomain ? `subdomains under ${parentDomain}` : 'domains'} and
            claim them for free!
          </p>
        </TooltipContent>
      </Tooltip>
      <Spotlight
        target={containerRef.current}
        visible={isFreeMintGuidanceVisible}
        onClose={() => setIsFreeMintGuidanceVisible(false)}
      />
    </>
  );
};

// Progressive DomainCard that shows skeleton states for missing data
export const DomainCard: FC<{
  domain?: NamefiNormalizedDomain;
  availabilityInfo?: DomainAvailabilityInfo;
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
  eppAuthorizationCode,
  onEppCodeChange,
  isImportMode,
  freeClaimEligibility,
}) => {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();
  const eppInputRef = useRef<HTMLInputElement>(null);

  const logBeginCheckout = useCallback(() => {
    const beginCheckoutEvent: BeginCheckoutEvent = {
      name: InteractionLoggingEventName.BeginCheckout,
      properties: {},
    };
    logEventWithInteractionLoggers(beginCheckoutEvent);
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
    ? itemTypeSchema.Values.IMPORT
    : itemTypeSchema.Values.REGISTER;
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

  /* ADD handler --------------------------------------------------------- */
  const handleAdd = useCallback(async () => {
    if (!availabilityInfo) return;
    const minDuration = availabilityInfo.durationValidationInYears?.min ?? 1;
    await cart.addItem({
      domainAvailabilityInfo: availabilityInfo,
      durationInYears: minDuration,
      operationType: 'REGISTER',
    });
  }, [cart, availabilityInfo]);

  /* REMOVE handler ------------------------------------------------------ */
  const handleRemove = useCallback(async () => {
    if (domain) {
      await cart.removeItem(domain);
    }
  }, [cart, domain]);

  /* IMPORT handler ------------------------------------------------------ */
  const handleImport = useCallback(async () => {
    if (!availabilityInfo) return;

    // Check if we have an EPP authorization code from the input
    const existingEppCode = eppAuthorizationCode;

    if (!existingEppCode || !existingEppCode.trim()) {
      // No EPP code provided, focus the input
      eppInputRef.current?.focus();
      return;
    }

    const minDuration = availabilityInfo.durationValidationInYears?.min ?? 1;
    await cart.addItem({
      domainAvailabilityInfo: availabilityInfo,
      durationInYears: minDuration,
      operationType: 'IMPORT',
      eppAuthorizationCode: existingEppCode,
    });
  }, [cart, availabilityInfo, eppAuthorizationCode]);

  const goToClaimPage = useCallback(() => {
    if (!domain) return;
    logBeginCheckout();
    router.push(`/claim/${domain}`);
  }, [domain, logBeginCheckout, router]);

  const hasAvailabilityInfo = availabilityInfo !== undefined;
  // When availabilityInfo is available, all data that CAN be loaded HAS been loaded
  // Some domains (like unsupported ones) may legitimately not have pricing
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
      <CardContent className="h-full w-full">
        <div className="flex items-center justify-between h-full w-full">
          <div className="space-y-1 flex-1 min-w-0 mr-4 overflow-hidden">
            <div className="font-semibold tracking-tight flex items-center gap-2">
              <div className="min-w-0 flex-1">
                {domain ? (
                  <h3 className="line-clamp-2 break-words">
                    {subdomain && (
                      <span className="text-3xl text-brand-tertiary">
                        {toUnicodeDomainName(subdomain)}
                      </span>
                    )}
                    {parentDomain && (
                      <span className="text-2xl text-foreground">
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
                <div className="flex items-center gap-3">
                  <p className="text-xl font-medium line-clamp-1">
                    {`${formatAmountInUSD(priceInUsd)} USD`}
                  </p>
                  {isNotNil(renewalPriceInUsd) && (
                    <p className="text-sm text-muted-foreground">
                      renews at {formatAmountInUSD(renewalPriceInUsd)} USD
                    </p>
                  )}
                </div>
              ) : null}
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
            {isImportable && (
              <div className="flex items-center gap-2 mt-2 w-80">
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
                  className="h-8 text-sm bg-gray-700/50 border-gray-600"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center shrink-0 gap-2">
            {/* Wishlist Heart Button */}
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
            ) : availabilityInfo.availability &&
              freeClaimEligibility?.eligible ? (
              <NamefiButton
                onClick={goToClaimPage}
                className="bg-brand-primary text-primary-foreground hover:bg-brand-primary/90"
              >
                <Gift className="h-4 w-4" />
                Free Claim
              </NamefiButton>
            ) : availabilityInfo.availability || isImportable ? (
              <AnimatedCartButton
                state={
                  removingBusy
                    ? 'removing'
                    : addingBusy
                      ? 'adding'
                      : inCart
                        ? 'in-cart'
                        : isImportable
                          ? 'import'
                          : 'add-to-cart'
                }
                onAdd={isImportable ? handleImport : handleAdd}
                onRemove={handleRemove}
                onGoToCart={() => {
                  logBeginCheckout();
                  router.push('/cart');
                }}
                showRemoveButton={inCart}
                disabled={addingBusy || removingBusy}
              />
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

export const SearchResults: FC<{
  isLoading: boolean;
  isError: boolean;
  error?: string;
  hasData: boolean;
  domains: NamefiNormalizedDomain[];
  domainInfos: Map<NamefiNormalizedDomain, DomainAvailabilityInfo>;
  query: string;
  eppAuthorizationCodes: Record<string, string | undefined>;
  onEppCodeChange: (domain: NamefiNormalizedDomain, eppCode: string) => void;
  searchMode: SearchMode;
  freeClaimEligibility?: Array<{
    domain: string;
    eligible: boolean;
    eligibility: Array<{
      groupOrCampaignKey: string;
      claimsAvailable: number;
      hasExactMatch: boolean;
      hasParentMatch: boolean;
    }>;
  }>;
}> = ({
  isLoading,
  isError,
  error,
  hasData,
  domainInfos,
  domains,
  query,
  eppAuthorizationCodes,
  onEppCodeChange,
  searchMode,
  freeClaimEligibility,
}) => {
  // Show error state
  if (isError && query.length > 0) {
    return (
      <div>
        <Placeholder
          title="Search Error"
          description={
            error || 'An error occurred while searching. Please try again.'
          }
        />
      </div>
    );
  }

  // Show loading skeletons when fetching but no data yet
  if (isLoading && !hasData) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeletons key="initial-loading" />
      </div>
    );
  }

  // Show search results with progressive loading
  if (hasData) {
    return (
      <div className="flex flex-col gap-4">
        {domains.map((domain) => {
          const availabilityInfo = domainInfos.get(domain);
          const claimEligibility = freeClaimEligibility?.find(
            (e) => e.domain === domain,
          );
          return (
            <DomainCard
              key={domain}
              domain={domain}
              availabilityInfo={availabilityInfo}
              eppAuthorizationCode={eppAuthorizationCodes[domain]}
              onEppCodeChange={(eppCode) => onEppCodeChange(domain, eppCode)}
              isImportMode={searchMode === SearchMode.IMPORT}
              freeClaimEligibility={claimEligibility}
            />
          );
        })}
      </div>
    );
  }

  // Show "no results" if we have searched, completed, and have no data
  if (query.length > 0 && !isLoading && !hasData) {
    return (
      <div>
        <Placeholder
          title="No domains found"
          description={`No domains matching "${query}" were found. Try a different search term.`}
        />
      </div>
    );
  }

  // If idle or empty query, don't render anything
  return null;
};
