'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { useCart } from '@/hooks/landing/use-cart';
import {
  type DomainData,
  useDomainFilters,
} from '@/hooks/landing/use-domain-filters';
import { useSearch } from '@/hooks/landing/use-search';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import {
  type BeginCheckoutEvent,
  InteractionLoggingEventName,
} from '@/utils/interaction-logging/events';
import { formatAmountInUSD } from '@/utils/number';
import {
  Loader2,
  SearchIcon,
  ShoppingCart,
  Trash,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { isNotNil } from 'ramda';
import { type FC, useCallback, useState } from 'react';
import FloatingCart from '../floating-cart';
import { NamefiButton } from '../namefi-button';
import { useInteractionLoggers } from '../providers/interactionLoggersProvider';
import { Placeholder } from './Placeholder';
import type { SearchComponent } from './types';

// Components
export const SearchHeader: FC<{
  parentDomain: string;
  setParentDomain: (domain: string) => void;
  isFirstPartyOrigin: boolean;
  tagline?: string;
}> = ({ parentDomain, setParentDomain, isFirstPartyOrigin, tagline }) => {
  return (
    <div className="flex flex-col items-center mt-40 p-4 gap-3">
      <h1 className="text-8xl font-bold text-white drop-shadow-lg">
        {parentDomain}
      </h1>
      <p className="text-4xl text-center text-white font-semibold drop-shadow-xl">
        {tagline || `Search for a domain on ${parentDomain}`}
      </p>
      {isFirstPartyOrigin && (
        <>
          <span className="text-sm font-medium">Network:</span>
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

export const SearchInput: FC<{
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  onSearch: () => void;
}> = ({ query, setQuery, isLoading, onSearch }) => (
  <div className="flex w-full max-w-3xl mx-auto">
    <div className="flex items-center w-full bg-black/30 backdrop-blur-md rounded-lg p-1">
      <div className="relative flex-1 bg-gray-700/80 rounded-md h-12 flex items-center">
        <div className="flex items-center w-full px-3">
          <SearchIcon className="h-5 w-5 text-gray-400 mr-2 shrink-0" />
          <Input
            placeholder="Search for a domain..."
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
      <NamefiButton
        disabled={isLoading || query.length === 0}
        onClick={onSearch}
        className="font-semibold rounded-md h-12 ml-1 text-lg w-[128px]"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
      </NamefiButton>
    </div>
  </div>
);

export const DomainCard: FC<{
  domain: DomainData;
  isDomainInCart: (domain: string) => boolean;
  handleDomainAction: (domain: DomainData) => void;
  isAddingToCart: boolean;
  isRemovingFromCart: boolean;
  isCartLoading: boolean;
}> = ({
  domain,
  isDomainInCart,
  handleDomainAction,
  isAddingToCart,
  isRemovingFromCart,
  isCartLoading,
}) => {
  const { logEventWithInteractionLoggers } = useInteractionLoggers();
  const router = useRouter();

  const logBeginCheckout = useCallback(() => {
    const beginCheckoutEvent: BeginCheckoutEvent = {
      name: InteractionLoggingEventName.BEGIN_CHECKOUT,
      properties: {},
    };
    logEventWithInteractionLoggers(beginCheckoutEvent);
  }, [logEventWithInteractionLoggers]);

  const isInCart = isDomainInCart(domain.domain);

  // Split domain into subdomain and parent domain
  const parts = domain.domain.split('.');
  const subdomain = parts[0];
  const parentDomain = parts.slice(1).join('.');

  return (
    <Card
      className={cn(
        'bg-white/5 backdrop-blur-lg h-32 transition-all duration-150 p-0 border-[1px] border-white/10',
        domain.availability ? 'opacity-100' : 'opacity-50',
      )}
    >
      <CardContent className="h-full w-full">
        <div className="flex items-center justify-between h-full w-full">
          <div className="space-y-1 flex-1 min-w-0 mr-4 overflow-hidden">
            <div className="font-semibold tracking-tight flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 break-words">
                  <span className="text-3xl text-brand-tertiary">
                    {subdomain}
                  </span>
                  <span className="text-2xl text-foreground">
                    .{parentDomain}
                  </span>
                </h3>
              </div>
              {!domain.availability && (
                <Badge className="ml-2 text-xs bg-black/70 text-white shrink-0 mt-2">
                  {isNotNil(domain.currentOwner) ? 'Taken' : 'Unavailable'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-medium line-clamp-1">
                {isNotNil(domain.priceInUSD)
                  ? `${formatAmountInUSD(domain.priceInUSD)} USD`
                  : ''}
              </p>
            </div>
            {!domain.availability && isNotNil(domain.currentOwner) && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="mr-1 h-3 w-3 shrink-0" />
                <span className="line-clamp-1">
                  Owner: {domain.currentOwner.substring(0, 6)}...
                  {domain.currentOwner.substring(
                    domain.currentOwner.length - 4,
                  )}
                </span>
              </div>
            )}
          </div>
          {domain.availability && (
            <TooltipProvider>
              {isInCart ? (
                <div className="flex space-x-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild={true}>
                      <NamefiButton
                        className="bg-black/40 border-white/10 hover:bg-red-600/80 hover:border-red-400/50 shrink-0"
                        onClick={() => handleDomainAction(domain)}
                        disabled={isRemovingFromCart || isCartLoading}
                      >
                        {isRemovingFromCart ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4 mr-1" />
                        )}
                        Remove
                      </NamefiButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      Remove this domain from your cart
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild={true}>
                      <NamefiButton
                        className="shrink-0"
                        onClick={() => {
                          logBeginCheckout();
                          router.push('/cart');
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        View Cart
                      </NamefiButton>
                    </TooltipTrigger>
                    <TooltipContent>Go to your cart</TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild={true}>
                    <NamefiButton
                      className="shrink-0"
                      onClick={() => handleDomainAction(domain)}
                      disabled={isAddingToCart || isCartLoading}
                    >
                      {isAddingToCart ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                      Add to cart
                    </NamefiButton>
                  </TooltipTrigger>
                  <TooltipContent>Add this domain to your cart</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <Card
        key={index}
        className="bg-white/5 backdrop-blur-lg h-32 transition-all duration-150 p-0 border-[1px] border-white/10"
      >
        <CardContent className="h-full w-full">
          <div className="flex items-center justify-between h-full w-full">
            <div className="space-y-1 flex-1 min-w-0 mr-4">
              <Skeleton className="h-8 w-full max-w-[250px]" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-full max-w-[100px]" />
              </div>
            </div>
            <Skeleton className="h-10 w-[120px] rounded-full shrink-0" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const SearchResults: FC<{
  isLoading: boolean;
  isLoadingMore: boolean;
  filteredDomains: DomainData[];
  query: string;
  isDomainInCart: (domain: string) => boolean;
  handleDomainAction: (domain: DomainData) => void;
  isAddingToCart: boolean;
  isRemovingFromCart: boolean;
  isCartLoading: boolean;
  parentDomain: string;
}> = ({
  isLoading,
  isLoadingMore,
  filteredDomains,
  query,
  isDomainInCart,
  handleDomainAction,
  isAddingToCart,
  isRemovingFromCart,
  isCartLoading,
  parentDomain,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (filteredDomains.length > 0 || isLoading || isLoadingMore) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="sync" presenceAffectsLayout={true}>
            {isLoading ? (
              <LoadingSkeletons key={`${parentDomain}-loading`} />
            ) : (
              <>
                {filteredDomains.map((domain) => (
                  <motion.div
                    {...(shouldReduceMotion
                      ? {}
                      : {
                          exit: { x: '-100vw', opacity: 0 },
                          animate: { x: 0, y: 0, opacity: 1 },
                          initial: { y: '100vh', opacity: 0 },
                          transition: { duration: 0.5, ease: 'easeInOut' },
                        })}
                    key={`${parentDomain}-${domain.domain}-${domain.availability}`}
                    layout={true}
                  >
                    <DomainCard
                      domain={domain}
                      isDomainInCart={isDomainInCart}
                      handleDomainAction={handleDomainAction}
                      isAddingToCart={isAddingToCart}
                      isRemovingFromCart={isRemovingFromCart}
                      isCartLoading={isCartLoading}
                    />
                  </motion.div>
                ))}

                {isLoadingMore && (
                  <LoadingSkeletons key={`${parentDomain}-loading`} />
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </MotionConfig>
    );
  }

  if (query.length > 0) {
    return (
      <AnimatePresence mode="sync" presenceAffectsLayout={true}>
        <motion.div
          animate={{ x: 0, opacity: 1 }}
          initial={{ x: '100vw', opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Placeholder
            title="No domains found"
            description={`No domains matching "${query}" were found. Try a different search term.`}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // If the query is empty, don't render anything
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
    domains,
    isSearchLoading,
    refetch,
    areSuggestionsLoading,
  } = useSearch(parentDomain);

  const {
    isCartDataLoading,
    isAddingToCart,
    isRemovingFromCart,
    isDomainInCart,
    handleDomainAction,
  } = useCart();

  const { activeTab, setActiveTab, filteredDomains } = useDomainFilters(
    domains,
    isDomainInCart,
  );

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
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isSearchLoading}
          onSearch={() => refetch()}
        />
      </div>

      {query.length > 0 && (
        <>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-between items-center py-5">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              <TabsList className="grid grid-cols-4 backdrop-blur-2xl rounded-md bg-black/50">
                <TabsTrigger className="py-2 px-3 w-32 rounded-sm" value="all">
                  All
                </TabsTrigger>
                <TabsTrigger
                  className="py-2 px-3 w-32 rounded-sm"
                  value="available"
                >
                  Available
                </TabsTrigger>
                <TabsTrigger
                  className="py-2 px-3 w-32 rounded-sm"
                  value="taken"
                >
                  Taken
                </TabsTrigger>
                <TabsTrigger
                  className="py-2 px-3 w-32 rounded-sm"
                  value="unavailable"
                >
                  Unavailable
                </TabsTrigger>
                <TabsTrigger className="py-2 px-3 w-32 rounded-sm" value="cart">
                  In Cart
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
              <SearchResults
                isLoading={isSearchLoading}
                isLoadingMore={areSuggestionsLoading}
                filteredDomains={filteredDomains}
                query={query}
                isDomainInCart={isDomainInCart}
                handleDomainAction={handleDomainAction}
                isAddingToCart={isAddingToCart}
                isRemovingFromCart={isRemovingFromCart}
                isCartLoading={isCartDataLoading}
                parentDomain={parentDomain}
              />
            </TabsContent>
          </Tabs>
          <div className="sticky bottom-5 flex justify-center mt-4 px-4">
            <FloatingCart />
          </div>
        </>
      )}
    </div>
  );
};

Search.displayName = 'Search';
