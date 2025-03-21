'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatAmountInUSD } from '@/utils/number';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FC, type HTMLAttributes, useMemo, useState } from 'react';
import { Button } from './ui/shadcn/button';
import { Card, CardContent } from './ui/shadcn/card';
import { Input } from './ui/shadcn/input';

export type DomainSearchProps = HTMLAttributes<HTMLDivElement>;

export const DomainSearch: FC<DomainSearchProps> = ({
  className,
  ...rest
}: DomainSearchProps) => {
  const [query, setQuery] = useState('');

  const router = useRouter();

  const trpc = useTRPC();

  const { isAuthenticated } = useAuth();

  const searchQuery = useQuery({
    ...trpc.search.search.queryOptions({
      query,
      parentDomain: '0x.city',
    }),
    enabled: isAuthenticated && query.length > 0,
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
  const isDomainInCart = (domainName: string) => {
    return cartQuery.data?.items.some(
      (item) => item.normalizedDomainName === domainName,
    );
  };

  // Find cart item ID for a domain
  const getCartItemId = (domainName: string) => {
    return cartQuery.data?.items.find(
      (item) => item.normalizedDomainName === domainName,
    )?.id;
  };

  const handleDomainAction = (domain: {
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
  };

  if (!cartQuery.data?.items) {
    return null;
  }

  return (
    <div className={cn('flex gap-4 flex-col', className)} {...rest}>
      <div className="flex gap-4">
        <Input
          placeholder="Search for a domain..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1"
        />
        <Button>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      {cartQuery.data?.items?.length > 0 ? (
        <div className="flex justify-end">
          <Button onClick={() => router.push('/cart')}>
            Go to Cart ({cartQuery.data?.items?.length} items)
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {domains.map((domain) => (
          <Card
            key={domain.domain}
            className={cn(
              'transition-all duration-150',
              domain.availability
                ? 'border-green-500/20 hover:border-green-500'
                : 'border-red-500/20 hover:border-red-500',
            )}
          >
            <CardContent className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{domain.domain}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatAmountInUSD(domain.priceInUSD)}
                </p>
              </div>
              {domain.availability && (
                <Button
                  className="cursor-pointer"
                  variant={
                    isDomainInCart(domain.domain) ? 'secondary' : 'default'
                  }
                  onClick={() => handleDomainAction(domain)}
                >
                  {isDomainInCart(domain.domain)
                    ? 'Remove from Cart'
                    : 'Add to Cart'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

DomainSearch.displayName = 'DomainSearch';
