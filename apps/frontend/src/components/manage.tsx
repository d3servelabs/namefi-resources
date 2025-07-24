'use client';
import { TruncatedTextWithHover } from '@/components/truncated-text-with-hover';
import { AuthRequired } from '@/components/auth-required';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { TableBody } from '@/components/ui/shadcn/table';
import { useAuth } from '@/hooks/use-auth';
import { formatAmountInUSD } from '@/lib/number';
import { useTRPC } from '@/lib/trpc';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { inferOutput } from '@trpc/tanstack-react-query';
import { type FC, Suspense, useMemo } from 'react';

const LoadingSkeletons: FC = () => (
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
);

// TODO(Luis): consider adding pagination to SoldDomainsTable
function SoldDomainsContent() {
  type RegisteredSubdomain = inferOutput<
    typeof trpc.users.getRegisteredSubdomainsForParentDomainOwner
  >[number];

  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.users.getRegisteredSubdomainsForParentDomainOwner.queryOptions(),
  );

  const subdomains: RegisteredSubdomain[] = useMemo(() => {
    return (
      data?.map((domain) => ({
        ...domain,
        ownerAddress: domain.ownerAddress ?? '',
        id: domain.normalizedDomainName,
      })) || []
    );
  }, [data]);

  const revenue = useMemo(() => {
    const revenueInUsdCents = subdomains.reduce(
      (sum, soldDomain) => sum + soldDomain.priceInUsdCents,
      0,
    );
    return formatAmountInUSD(revenueInUsdCents, true);
  }, [subdomains]);

  const soldDomainsCount = useMemo(() => subdomains.length, [subdomains]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* SoldDomainsCountCard */}
      <Card className="bg-white/[0.03] border border-white/10 shadow-sm rounded-lg p-6 gap-0">
        <CardHeader>
          <CardTitle>Total Domains Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg">{soldDomainsCount}</div>
        </CardContent>
      </Card>

      {/* SoldDomainsProceedsCard */}
      <Card className="bg-white/[0.03] border border-white/10 shadow-sm rounded-lg p-6 gap-0">
        <CardHeader>
          <CardTitle>Proceeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg">{revenue}</div>
        </CardContent>
      </Card>

      {/* SoldDomainsTableCard */}
      <Card className="col-span-2 bg-white/[0.03] border border-white/10 shadow-sm rounded-lg p-6 gap-0">
        <CardHeader>
          <CardTitle>Domains Sold</CardTitle>
        </CardHeader>
        <CardContent>
          {subdomains.length === 0 && <div>No domains sold yet.</div>}
          {subdomains.length > 0 && (
            <Table className="w-full">
              <Thead>
                <Tr>
                  <Th>Domain Name</Th>
                  <Th>Wallet</Th>
                  <Th>Date</Th>
                  <Th>Price</Th>
                </Tr>
              </Thead>
              <TableBody>
                {subdomains.map((item) => (
                  <Tr key={item.normalizedDomainName}>
                    <Td className="font-medium">{item.normalizedDomainName}</Td>
                    <Td className="font-medium">
                      <TruncatedTextWithHover maxLength={12}>
                        {item.ownerAddress}
                      </TruncatedTextWithHover>
                    </Td>
                    <Td className="font-medium">
                      {item.updatedAt.toLocaleDateString()}
                    </Td>
                    <Td className="font-medium">
                      {formatAmountInUSD(item.priceInUsdCents, true)}
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ManageDashboard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!(isLoading || isAuthenticated)) {
    return <AuthRequired />;
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Sold Domains</h2>
      </div>
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <Suspense fallback={<LoadingSkeletons />}>
          <SoldDomainsContent />
        </Suspense>
      )}
    </div>
  );
}
