'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Badge } from '@/components/ui/shadcn/badge';
import { PasswordInput } from '@/components/ui/password-input';
import { useCartRow } from '@/hooks/use-cart-row';
import { useSearch } from '@/hooks/use-search';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import {
  type BeginCheckoutEvent,
  InteractionLoggingEventName,
} from '@/utils/interaction-logging/events';
import { formatAmountInUSD } from '@/utils/number';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/multi-year-pricing';
import { Loader2, SearchIcon, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isNotNil } from 'ramda';
import { type FC, useCallback, useMemo, useState, useRef } from 'react';
import FloatingCart from '../floating-cart';
import { NamefiButton } from '../buttons/namefi-button';
import { AnimatedCartButton } from '../buttons/animated-cart-button';
import { useInteractionLoggers } from '../providers/interactionLoggersProvider';
import { Placeholder } from './placeholder';
import type {
  ImportQuery,
  SearchComponent,
  EppAuthorizationCodesFormData,
} from './types';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eppAuthorizationCodesFormSchema } from './types';
import { useEffect } from 'react';

// Components
export const SearchHeader: FC<{
  parentDomain: string | undefined;
  setParentDomain: (domain: string | undefined) => void;
  isFirstPartyOrigin: boolean;
  tagline?: string;
  hideNetworkSelection?: boolean;
}> = ({
  parentDomain,
  setParentDomain,
  isFirstPartyOrigin,
  tagline,
  hideNetworkSelection = false,
}) => {
  return (
    <div className="flex flex-col items-center mt-40 p-4 gap-3">
      <h1 className="text-8xl font-bold text-secondary-foreground drop-shadow-lg">
        {parentDomain}
      </h1>
      <p className="text-4xl text-center text-secondary-foreground font-semibold drop-shadow-xl">
        {tagline || `Search for a domain on ${parentDomain ?? 'All Networks'}`}
      </p>
      {isFirstPartyOrigin && !hideNetworkSelection && (
        <>
          <span className="text-sm font-medium">Network:</span>
          <Button
            key="main"
            variant={parentDomain === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setParentDomain(undefined)}
            className="h-8 px-3"
          >
            All Networks
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
        </>
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
      <TabsList className="grid w-full h-full grid-cols-2 bg-black/30 backdrop-blur-md">
        <TabsTrigger
          value={SearchMode.REGISTER}
          className="h-full data-[state=active]:bg-gray-700/80"
        >
          Register
        </TabsTrigger>
        <TabsTrigger
          value={SearchMode.IMPORT}
          className="h-full data-[state=active]:bg-gray-700/80"
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
}> = ({ query, setQuery, importQuery, isLoading, searchMode, onSearch }) => {
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex w-full max-w-3xl mx-auto gap-1 items-center">
      <div className="flex items-center flex-1 overflow-hidden bg-black/30 backdrop-blur-md rounded-lg p-1">
        <div className="relative w-full bg-gray-700/80 rounded-md h-12 flex items-center">
          <div className="flex items-center w-full px-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 mr-2 shrink-0 animate-spin" />
            ) : searchMode === SearchMode.IMPORT ? (
              <SearchIcon className="h-5 w-5 text-gray-400 mr-2 shrink-0" />
            ) : (
              <SearchIcon className="h-5 w-5 text-gray-400 mr-2 shrink-0" />
            )}
            <Input
              ref={inputRef}
              placeholder={
                searchMode === SearchMode.IMPORT
                  ? 'Paste CSV to import domains...'
                  : 'Search for a domain...'
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
  );
};

// Progressive DomainCard that shows skeleton states for missing data
export const DomainCard: FC<{
  domain?: NamefiNormalizedDomain;
  availabilityInfo?: DomainAvailabilityInfo;
  eppAuthorizationCode?: string;
  onEppCodeChange?: (eppCode: string) => void;
  isImportMode?: boolean;
}> = ({
  domain,
  availabilityInfo,
  eppAuthorizationCode,
  onEppCodeChange,
  isImportMode,
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
                <p className="text-xl font-medium line-clamp-1">
                  {`${formatAmountInUSD(priceInUsd)} USD`}
                </p>
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
          <div className="flex items-center justify-center shrink-0">
            {shouldShowActionSkeleton ? (
              <Skeleton className="h-10 w-[120px] rounded-full bg-gray-600/50" />
            ) : isUnsupported ? (
              <Badge variant="destructive" className="text-xs">
                Unsupported
              </Badge>
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
          return (
            <DomainCard
              key={domain}
              domain={domain}
              availabilityInfo={availabilityInfo}
              eppAuthorizationCode={eppAuthorizationCodes[domain]}
              onEppCodeChange={(eppCode) => onEppCodeChange(domain, eppCode)}
              isImportMode={searchMode === SearchMode.IMPORT}
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

// Main component
export const Search: SearchComponent = ({ originInfo }) => {
  const [parentDomain, setParentDomain] = useState<string | undefined>(() => {
    if (originInfo.isFirstPartyOrigin) {
      return config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES[0];
    }

    if (originInfo.thirdPartyHostname) {
      return originInfo.thirdPartyHostname;
    }
    return undefined;
  });

  const {
    query,
    setQuery,
    runSearch,
    searchMode,
    onSearchModeChange,
    importQuery,
    isLoading,
    isError,
    error,
    hasData,
    domainInfos,
    domains,
  } = useSearch(parentDomain || undefined);

  // Form for EPP authorization codes
  const form = useForm<EppAuthorizationCodesFormData>({
    resolver: zodResolver(eppAuthorizationCodesFormSchema),
    defaultValues: {
      eppAuthorizationCodes: {},
    },
  });

  const [isBusy, setIsBusy] = useState(false);

  // Initialize form with auth codes from importQuery
  const initializeEppCodes = useCallback(() => {
    if (importQuery && importQuery.size > 0) {
      const initialCodes: Record<string, string> = {};
      importQuery.forEach((query, domain) => {
        if (query.eppAuthorizationCode) {
          initialCodes[domain] = query.eppAuthorizationCode;
        }
      });
      form.reset({ eppAuthorizationCodes: initialCodes });
    }
  }, [importQuery, form]);

  // Initialize when importQuery changes
  useEffect(() => {
    initializeEppCodes();
  }, [initializeEppCodes]);

  // Handle EPP authorization code changes
  const handleEppCodeChange = useCallback(
    (domain: NamefiNormalizedDomain, eppCode: string) => {
      form.setValue('eppAuthorizationCodes', {
        ...form.getValues('eppAuthorizationCodes'),
        [domain]: eppCode,
      });
    },
    [form],
  );

  // Get current EPP authorization codes
  const eppAuthorizationCodes = form.watch('eppAuthorizationCodes');

  // Calculate importable domains for FloatingCart
  const importableDomains = useMemo(() => {
    if (searchMode !== SearchMode.IMPORT || !domains || !domainInfos) {
      return [];
    }

    return domains
      .map((domain) => {
        const availabilityInfo = domainInfos.get(domain);
        const eppCode = eppAuthorizationCodes[domain];

        if (!availabilityInfo || !eppCode || !eppCode.trim()) return null;

        if (!isDomainImportable(availabilityInfo)) return null;

        return {
          domain,
          availabilityInfo,
          eppAuthorizationCode: eppCode,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [searchMode, domains, domainInfos, eppAuthorizationCodes]);

  if (!parentDomain) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className="relative flex gap-4 flex-col">
      <div className="flex flex-col items-center gap-4">
        <SearchHeader
          parentDomain={parentDomain}
          setParentDomain={setParentDomain}
          isFirstPartyOrigin={originInfo.isFirstPartyOrigin}
        />
        <SearchModeTabs
          searchMode={searchMode}
          onSearchModeChange={onSearchModeChange}
        />
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isLoading}
          searchMode={searchMode}
          importQuery={importQuery}
          onSearch={runSearch}
        />
      </div>

      {query.length > 0 && (isLoading || hasData || isError) && (
        <>
          <div className="flex justify-between items-center py-5">
            <h2 className="text-2xl font-semibold">Search Results</h2>
          </div>

          <SearchResults
            isLoading={isLoading}
            isError={isError}
            error={error}
            hasData={hasData}
            domainInfos={domainInfos}
            domains={domains}
            query={query}
            eppAuthorizationCodes={eppAuthorizationCodes}
            onEppCodeChange={handleEppCodeChange}
            searchMode={searchMode}
          />

          <div className="sticky bottom-5 flex justify-center mt-4 px-4">
            <FloatingCart
              searchMode={searchMode}
              importableDomains={importableDomains}
              onBusyChange={setIsBusy}
            />
          </div>
        </>
      )}
    </div>
  );
};
