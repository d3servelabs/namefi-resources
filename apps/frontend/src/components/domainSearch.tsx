'use client';

import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
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
import { cn } from '@/lib/utils';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  CircleOff,
  Loader2,
  Search,
  ShoppingCart,
  Tag,
  User,
  X,
} from 'lucide-react';
import {
  type FC,
  type HTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from 'react';

export type DomainSearchProps = HTMLAttributes<HTMLDivElement>;

export const DomainSearch: FC<DomainSearchProps> = ({
  className,
  ...rest
}: DomainSearchProps) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [parentDomain, setParentDomain] = useState<'0x.city' | 'defi.build'>(
    '0x.city',
  );

  const trpc = useTRPC();

  const { isAuthenticated } = useAuth();

  const searchQuery = useQuery({
    ...trpc.search.search.queryOptions({
      query,
      parentDomain,
    }),
    enabled: query.length > 0,
  });

  const domains = useMemo(
    () => searchQuery?.data?.bulkAvailability ?? [],
    [searchQuery?.data?.bulkAvailability],
  );

  // Get cart data to check if domains are already in cart
  const cartQuery = useQuery({
    ...trpc.carts.getOrCreate.queryOptions(),
    enabled: isAuthenticated,
  });

  // Mutations for cart operations
  const addToCart = useMutation({
    ...trpc.carts.addItem.mutationOptions({
      onSuccess: () => {
        cartQuery.refetch();
      },
    }),
  });

  const removeFromCart = useMutation({
    ...trpc.carts.removeItem.mutationOptions({
      onSuccess: () => {
        cartQuery.refetch();
      },
    }),
  });

  // Check if domain is in cart
  const isDomainInCart = useCallback(
    (domainName: string) => {
      return cartQuery.data?.items.some(
        (item) => item.normalizedDomainName === domainName,
      );
    },
    [cartQuery.data?.items],
  );

  // Find cart item ID for a domain
  const getCartItemId = useCallback(
    (domainName: string) => {
      return cartQuery.data?.items.find(
        (item) => item.normalizedDomainName === domainName,
      )?.id;
    },
    [cartQuery.data?.items],
  );

  const handleDomainAction = useCallback(
    (domain: {
      domain: string;
      priceInUSD: number;
    }) => {
      if (isDomainInCart(domain.domain)) {
        const itemId = getCartItemId(domain.domain);
        if (itemId) {
          removeFromCart.mutate(itemId);
        }
      } else {
        addToCart.mutate({
          normalizedDomainName: domain.domain,
          amountInUSDCents: domain.priceInUSD * 100,
        });
      }
    },
    [isDomainInCart, getCartItemId, removeFromCart, addToCart],
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

  const isLoading = searchQuery.isLoading || searchQuery.isFetching;
  const isCartLoading = cartQuery.isLoading || cartQuery.isFetching;
  const isAddingToCart = addToCart.isPending;
  const isRemovingFromCart = removeFromCart.isPending;

  return (
    <div className={cn('flex gap-4 flex-col', className)} {...rest}>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold">Domain Search</CardTitle>
          <CardDescription>
            Find your perfect domain name on the {parentDomain} network
          </CardDescription>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm font-medium">Network:</span>
            <div className="flex items-center space-x-2">
              <Button
                variant={parentDomain === '0x.city' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParentDomain('0x.city')}
                className="h-8 px-3"
              >
                0x.city
              </Button>
              <Button
                variant={parentDomain === 'defi.build' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParentDomain('defi.build')}
                className="h-8 px-3"
              >
                defi.build
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
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
            <Button
              disabled={isLoading || query.length === 0}
              onClick={() => searchQuery.refetch()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {query.length > 0 && (
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
            {isLoading ? (
              // Loading state
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
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
            ) : filteredDomains.length > 0 ? (
              // Results
              <div className="flex flex-col gap-4">
                {filteredDomains.map((domain) => (
                  <Card
                    key={domain.domain}
                    className={cn(
                      'transition-all duration-150',
                      domain.availability
                        ? 'border-green-500/20 hover:border-green-500/40'
                        : 'border-red-500/20 hover:border-red-500/40',
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">
                              {domain.domain}
                            </h3>
                            <Badge
                              variant={
                                domain.availability ? 'default' : 'destructive'
                              }
                              className="ml-2"
                            >
                              {domain.availability ? (
                                <BadgeCheck className="mr-1 h-3 w-3" />
                              ) : (
                                <CircleOff className="mr-1 h-3 w-3" />
                              )}
                              {domain.availability ? 'Available' : 'Taken'}
                            </Badge>
                            {isDomainInCart(domain.domain) && (
                              <Badge variant="secondary">
                                <ShoppingCart className="mr-1 h-3 w-3" />
                                In Cart
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Tag className="mr-1 h-3 w-3" />
                              {formatAmountInUSD(domain.priceInUSD)}
                            </div>
                            {!domain.availability && (
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
                                  className="cursor-pointer"
                                  variant={
                                    isDomainInCart(domain.domain)
                                      ? 'secondary'
                                      : 'default'
                                  }
                                  onClick={() => handleDomainAction(domain)}
                                  disabled={
                                    isAddingToCart ||
                                    isRemovingFromCart ||
                                    isCartLoading
                                  }
                                >
                                  {(isAddingToCart || isRemovingFromCart) &&
                                  isDomainInCart(domain.domain) ===
                                    !!isRemovingFromCart ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : isDomainInCart(domain.domain) ? (
                                    <X className="mr-2 h-4 w-4" />
                                  ) : (
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                  )}
                                  {isDomainInCart(domain.domain)
                                    ? 'Remove from Cart'
                                    : 'Add to Cart'}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isDomainInCart(domain.domain)
                                  ? 'Remove this domain from your cart'
                                  : 'Add this domain to your cart'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : query.length > 0 ? (
              // No results
              <EmptyPlaceholder>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <EmptyPlaceholder.Title>
                  No domains found
                </EmptyPlaceholder.Title>
                <EmptyPlaceholder.Description>
                  No domains matching "{query}" were found. Try a different
                  search term.
                </EmptyPlaceholder.Description>
              </EmptyPlaceholder>
            ) : (
              // Empty state
              <EmptyPlaceholder>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <EmptyPlaceholder.Title>
                  Search for domains
                </EmptyPlaceholder.Title>
                <EmptyPlaceholder.Description>
                  Enter a domain name above to search for available domains on
                  0x.city
                </EmptyPlaceholder.Description>
              </EmptyPlaceholder>
            )}
          </TabsContent>
        </Tabs>
      )}

      {query.length === 0 && (
        <EmptyPlaceholder>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <EmptyPlaceholder.Title>
            Find your perfect domain
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            Enter a domain name in the search box to find available domains on
            0x.city
          </EmptyPlaceholder.Description>
          <Button variant="outline" onClick={() => setQuery('example')}>
            Try an example search
          </Button>
        </EmptyPlaceholder>
      )}
    </div>
  );
};

DomainSearch.displayName = 'DomainSearch';
