'use client';

import {
  useOrigin,
  useOriginInfo,
} from '@/components/providers/originProvider';
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
import { useAuth } from '@/hooks/useAuth';
import { config } from '@/lib/env';
import { cn } from '@/lib/utils';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  CircleOff,
  Loader2,
  SearchIcon,
  ShoppingCart,
  Tag,
  User,
  X,
} from 'lucide-react';
import {
  type FC,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Placeholder } from './Placeholder';

// Types
export type DomainSearchProps = HTMLAttributes<HTMLDivElement>;
type DomainData = {
  domain: string;
  availability: boolean;
  priceInUSD?: number | null;
  currentOwner?: string | null;
};

// Components
const SearchHeader: FC<{
  parentDomain: string;
  setParentDomain: (domain: string) => void;
}> = ({ parentDomain, setParentDomain }) => {
  const originInfo = useOriginInfo();

  return (
    <div className="flex flex-col items-center mt-40 p-4 gap-3">
      <h1 className="text-8xl font-bold text-white drop-shadow-lg">
        {parentDomain}
      </h1>
      <p className="text-4xl text-white font-semibold drop-shadow-xl">
        Search for a domain on {parentDomain}
      </p>
      {originInfo.isFirstPartyOrigin && (
        <>
          <span className="text-sm font-medium">Network:</span>
          {config.POWERED_BY_NAMEFI_THIRD_PARTY_ORIGINS.map((origin) => (
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

const SearchInput: FC<{
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  onSearch: () => void;
}> = ({ query, setQuery, isLoading, onSearch }) => (
  <div className="flex gap-4 items-center">
    <div className="relative flex-1 lg:w-[616px]">
      <Input
        placeholder="Search for a domain..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="pr-10"
      />
      {query.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full"
          onClick={() => setQuery('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
    <Button disabled={isLoading || query.length === 0} onClick={onSearch}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <SearchIcon className="mr-2 h-4 w-4" />
      )}
      Search
    </Button>
  </div>
);

const DomainCard: FC<{
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
  const isInCart = isDomainInCart(domain.domain);

  return (
    <Card
      className={cn(
        'bg-white/5 backdrop-blur-lg h-32 transition-all duration-150 p-0',
        domain.availability
          ? 'border-green-500/20 hover:border-green-500/40'
          : 'border-red-500/20 hover:border-red-500/40',
      )}
    >
      <CardContent className="h-full w-full">
        <div className="flex items-center justify-between h-full w-full">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">{domain.domain}</h3>
              <Badge
                variant={domain.availability ? 'default' : 'destructive'}
                className="ml-2"
              >
                {domain.availability ? (
                  <BadgeCheck className="mr-1 h-3 w-3" />
                ) : (
                  <CircleOff className="mr-1 h-3 w-3" />
                )}
                {domain.availability ? 'Available' : 'Taken'}
              </Badge>
              {isInCart && (
                <Badge variant="secondary">
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  In Cart
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Tag className="mr-1 h-3 w-3" />
                {domain.priceInUSD ? formatAmountInUSD(domain.priceInUSD) : ''}
              </div>
              {!domain.availability && domain.currentOwner && (
                <div className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  Owner: {domain.currentOwner.substring(0, 6)}...
                  {domain.currentOwner.substring(
                    domain.currentOwner.length - 4,
                  )}
                </div>
              )}
            </div>
          </div>
          {domain.availability && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild={true}>
                  <Button
                    className="cursor-pointer bg-brand-primary"
                    variant={isInCart ? 'secondary' : 'default'}
                    onClick={() => handleDomainAction(domain)}
                    disabled={
                      isAddingToCart || isRemovingFromCart || isCartLoading
                    }
                  >
                    {(isAddingToCart || isRemovingFromCart) &&
                    isInCart === isRemovingFromCart ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isInCart ? (
                      <X className="mr-2 h-4 w-4" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    {isInCart ? 'Remove from Cart' : 'Add to Cart'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInCart
                    ? 'Remove this domain from your cart'
                    : 'Add this domain to your cart'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <Card key={index} className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const SearchResults: FC<{
  isLoading: boolean;
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
  filteredDomains,
  query,
  isDomainInCart,
  handleDomainAction,
  isAddingToCart,
  isRemovingFromCart,
  isCartLoading,
  parentDomain,
}) => {
  if (isLoading) {
    return <LoadingSkeletons />;
  }

  if (filteredDomains.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        {filteredDomains.map((domain, index) => (
          <DomainCard
            key={`${parentDomain}-${domain.domain}-${index}`}
            domain={domain}
            isDomainInCart={isDomainInCart}
            handleDomainAction={handleDomainAction}
            isAddingToCart={isAddingToCart}
            isRemovingFromCart={isRemovingFromCart}
            isCartLoading={isCartLoading}
          />
        ))}
      </div>
    );
  }

  if (query.length > 0) {
    return (
      <Placeholder
        title="No domains found"
        description={`No domains matching "${query}" were found. Try a different search term.`}
      />
    );
  }

  return (
    <Placeholder
      title="Search for domains"
      description={`Enter a domain name above to search for available domains on ${parentDomain}`}
    />
  );
};

// Main component
export const Search: FC<DomainSearchProps> = ({
  className,
  ...rest
}: DomainSearchProps) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { isLoading: isOriginLoading, originInfo } = useOrigin();
  const [parentDomain, setParentDomain] = useState<string | undefined>(
    undefined,
  );

  // Initialize parentDomain when origin info is available
  useEffect(() => {
    if (!isOriginLoading) {
      if (originInfo.isFirstPartyOrigin) {
        setParentDomain(config.POWERED_BY_NAMEFI_THIRD_PARTY_ORIGINS[0]);
      } else if (originInfo.thirdPartyOrigin) {
        setParentDomain(originInfo.thirdPartyOrigin);
      }
    }
  }, [isOriginLoading, originInfo]);

  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();

  // Data fetching hooks
  const {
    data: searchData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    ...trpc.search.search.queryOptions({
      query,
      parentDomain,
    }),
    enabled: query.length > 0 && !!parentDomain,
  });

  const {
    data: cartData,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    refetch: refetchCart,
  } = useQuery({
    ...trpc.carts.getItems.queryOptions(),
    enabled: isAuthenticated,
  });

  // Mutations
  const { mutate: addToCartMutate, isPending: isAddingToCart } = useMutation({
    ...trpc.carts.addItem.mutationOptions({
      onSuccess: () => refetchCart(),
    }),
  });

  const { mutate: removeFromCartMutate, isPending: isRemovingFromCart } =
    useMutation({
      ...trpc.carts.removeItem.mutationOptions({
        onSuccess: () => refetchCart(),
      }),
    });

  // Derived state
  const domains = useMemo(
    () =>
      (searchData?.bulkAvailability ?? []).filter(
        (domain) => domain.domain !== query,
      ),
    [searchData?.bulkAvailability, query],
  );

  // Helper functions
  const isDomainInCart = useCallback(
    (domainName: string) => {
      return !!cartData?.some(
        (item) => item.normalizedDomainName === domainName,
      );
    },
    [cartData],
  );

  const getCartItemId = useCallback(
    (domainName: string) => {
      return cartData?.find((item) => item.normalizedDomainName === domainName)
        ?.id;
    },
    [cartData],
  );

  const handleDomainAction = useCallback(
    (domain: DomainData) => {
      if (isDomainInCart(domain.domain)) {
        const itemId = getCartItemId(domain.domain);
        if (itemId) {
          removeFromCartMutate(itemId);
        }
      } else {
        addToCartMutate({
          normalizedDomainName: domain.domain,
          amountInUSDCents: domain.priceInUSD ? domain.priceInUSD * 100 : 0,
        });
      }
    },
    [isDomainInCart, getCartItemId, removeFromCartMutate, addToCartMutate],
  );

  // Filter domains based on active tab
  const filteredDomains = useMemo(() => {
    if (activeTab === 'available') {
      return domains.filter((domain) => domain.availability);
    }
    if (activeTab === 'taken') {
      return domains.filter((domain) => !domain.availability);
    }
    if (activeTab === 'cart') {
      return domains.filter((domain) => isDomainInCart(domain.domain));
    }
    return domains;
  }, [domains, activeTab, isDomainInCart]);

  const isSearchLoading = isLoading || isFetching;
  const isCartDataLoading = isCartLoading || isCartFetching;

  if (isOriginLoading || !parentDomain) {
    // Return loading state or null while origin info is loading
    return null;
  }

  return (
    <div className={cn('flex gap-4 flex-col', className)} {...rest}>
      <div className="flex flex-col items-center gap-4">
        <SearchHeader
          parentDomain={parentDomain}
          setParentDomain={setParentDomain}
        />
        <SearchInput
          query={query}
          setQuery={setQuery}
          isLoading={isSearchLoading}
          onSearch={() => refetch()}
        />
      </div>

      {query.length > 0 ? (
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="taken">Taken</TabsTrigger>
            <TabsTrigger value="cart">In Cart</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <SearchResults
              isLoading={isSearchLoading}
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
      ) : (
        <Placeholder
          title="Find your perfect domain"
          description={`Enter a domain name in the search box to find available domains on ${parentDomain}`}
        >
          <Button variant="outline" onClick={() => setQuery('example')}>
            Try an example search
          </Button>
        </Placeholder>
      )}
    </div>
  );
};

Search.displayName = 'DomainSearch';
