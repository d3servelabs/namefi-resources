'use client';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/shadcn/card';
import { useMemo } from 'react';
import { DomainTable } from '@/components/powered-by-namefi/DomainTable';
import { RevenuePie } from '@/components/powered-by-namefi/RevenuePie';
import { RevenueBar } from '@/components/powered-by-namefi/RevenueBar';
import { DomainTableSkeleton } from '@/components/powered-by-namefi/DomainTableSkeleton';
import { RevenueSkeleton } from '@/components/powered-by-namefi/RevenueSkeleton';
import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);
import { withPbnOwnerGuard } from '@/components/admin/pbn-owner-guard';
import { keccak256 } from 'viem';

function PoweredByNamefiOwnerDashboard() {
  const trpc = useTRPC();

  const domainsQuery = useQuery(trpc.pbnOwner.listOwnedDomains.queryOptions());

  const revenueByDomainQuery = useQuery(
    trpc.pbnOwner.revenueByDomain.queryOptions({}),
  );

  const revenuePieData = useMemo(() => {
    const rows = revenueByDomainQuery.data?.byDomain ?? [];
    if (!rows.length) return null;
    return {
      labels: rows.map((r) => r.normalizedDomainName),
      datasets: [
        {
          label: 'Revenue (USD)',
          data: rows.map((r) => (r.amountInUsdCents ?? 0) / 100),
          backgroundColor: rows.map((r) =>
            deterministicColorFromDomainNameHash(r.normalizedDomainName),
          ),
        },
      ],
    };
  }, [revenueByDomainQuery.data?.byDomain]);

  // Overview page does not render a line chart; only pie chart of totals per domain

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Powered by Namefi Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Domains</CardTitle>
          </CardHeader>
          <CardContent>
            {domainsQuery.isLoading ? (
              <DomainTableSkeleton />
            ) : (
              <DomainTable domains={(domainsQuery.data as any) ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue (Bar)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDomainQuery.isLoading ? (
              <RevenueSkeleton />
            ) : (
              <RevenueBar data={revenuePieData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue (Pie)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDomainQuery.isLoading ? (
              <RevenueSkeleton />
            ) : (
              <RevenuePie
                data={revenuePieData}
                totalInUsdCents={
                  revenueByDomainQuery.data?.totalInUsdCents ?? 0
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withPbnOwnerGuard(PoweredByNamefiOwnerDashboard);

function deterministicColorFromDomainNameHash(domain: string): string {
  const sourceBytes = new TextEncoder().encode(domain);

  const hashValue = keccak256(sourceBytes);
  const h = BigInt(hashValue) & BigInt(0xfffff);
  console.log(`Hash value for domain ${domain}:`, h, hashValue);

  const selected = Number(h % BigInt(360));

  return `hsl(${selected}, 45%, 50%)`;
}
