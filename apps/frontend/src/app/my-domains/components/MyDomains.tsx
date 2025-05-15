'use client';

import NetworkLogo from '@/components/NetworkLogo';
import { TruncatedTextWithHover } from '@/components/TruncatedTextWithHover';
import { AuthRequired } from '@/components/auth-required';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TableBody } from '@/components/ui/shadcn/table';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SearchIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { type FC, type HTMLAttributes, Suspense, useMemo } from 'react';

function useGetDomains() {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.users.getCurrentUserDomains.queryOptions(),
  );

  const domains = useMemo(() => {
    return (
      data?.map(({ normalizedDomainName, chainId, ownerAddress }) => ({
        id: normalizedDomainName,
        normalizedDomainName,
        chainId,
        ownerAddress,
      })) || []
    );
  }, [data]);

  return domains;
}

const LoadingSkeletons: FC = () => (
  <div className="flex flex-col gap-4">
    <Card>
      <CardContent>
        <Table className="w-full">
          <Thead>
            <Tr>
              <Th>Chain</Th>
              <Th>Wallet</Th>
              <Th>Domain Name</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <TableBody>
            {[...new Array(3)].map((_, index) => (
              <Tr key={index}>
                <Td>
                  <Skeleton className="h-6 w-6" />
                </Td>
                <Td>
                  <Skeleton className="h-6 w-24" />
                </Td>
                <Td className="font-medium w-full">
                  <Skeleton className="h-6 w-28" />
                </Td>
                <Td className="text-right">
                  <Skeleton className="h-6 w-32" />
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

const MyDomainsEmptyPlaceholder: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>No domains found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        Start the search for your next domain by clicking the button below
      </EmptyPlaceholder.Description>
      <Button variant="outline">
        <Link href={'/'} aria-label="Button to go to the search page">
          Search Page
        </Link>
      </Button>
    </EmptyPlaceholder>
  );
};

function MyDomainsTable() {
  const domains = useGetDomains();

  if (domains.length === 0) {
    return <MyDomainsEmptyPlaceholder />;
  }

  return (
    <Card>
      <CardContent>
        <Table className="w-full">
          <Thead>
            <Tr>
              <Th>Chain</Th>
              <Th>Wallet</Th>
              <Th>Domain Name</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <TableBody>
            {domains.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <NetworkLogo network={item.chainId} className="w-6 h-6" />
                </Td>
                <Td>
                  <TruncatedTextWithHover maxLength={12}>
                    {item.ownerAddress}
                  </TruncatedTextWithHover>
                </Td>
                <Td className="font-medium w-full">
                  <Link
                    href={`/domain/${item.normalizedDomainName}`}
                    aria-label={`Settings for ${item.normalizedDomainName}`}
                  >
                    {item.normalizedDomainName}
                  </Link>
                </Td>
                <Td className="text-right">
                  <div className="flex gap-2">
                    <Button variant="outline" asChild={true}>
                      <Link
                        href={`/domain/${item.normalizedDomainName}`}
                        aria-label={`Settings for ${item.normalizedDomainName}`}
                      >
                        <Settings /> Manage DNS
                      </Link>
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function MyDomains() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <MyDomainsTable />
        </Suspense>
      )}
    </div>
  );
}
