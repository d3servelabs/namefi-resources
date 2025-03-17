'use client';

import { useTRPC } from '@/utils/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './shadcn/button';
import { Card, CardContent } from './shadcn/card';
import { Input } from './shadcn/input';

// Dummy domain data
const DUMMY_DOMAINS = [
  { name: 'example.com', price: 1999 },
  { name: 'mydomain.com', price: 2499 },
  { name: 'coolsite.com', price: 1599 },
  { name: 'awesome.com', price: 3999 },
  { name: 'newdomain.com', price: 1799 },
];

export function DomainSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const trpc = useTRPC();

  // Get cart data to check if domains are already in cart
  const cartQuery = useQuery({
    ...trpc.carts.getOrCreate.queryOptions(),
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

  const handleDomainAction = (domain: { name: string; price: number }) => {
    if (isDomainInCart(domain.name)) {
      const itemId = getCartItemId(domain.name);
      if (itemId) {
        removeFromCart.mutate(itemId);
      }
    } else {
      addToCart.mutate({
        normalizedDomainName: domain.name,
        amountInUSDCents: domain.price,
      });
    }
  };

  if (!cartQuery.data?.items) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder="Search for a domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      <div className="grid gap-4">
        {DUMMY_DOMAINS.filter((domain) =>
          domain.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ).map((domain) => (
          <Card key={domain.name}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-medium">{domain.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ${(domain.price / 100).toFixed(2)}
                </p>
              </div>
              <Button
                variant={isDomainInCart(domain.name) ? 'secondary' : 'default'}
                onClick={() => handleDomainAction(domain)}
              >
                {isDomainInCart(domain.name)
                  ? 'Remove from Cart'
                  : 'Add to Cart'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
