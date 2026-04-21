'use client';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@namefi-astra/ui/components/shadcn/card';
import { useMemo } from 'react';
import { DomainTable } from '@/components/powered-by-namefi/DomainTable';
import { RevenuePie } from '@/components/powered-by-namefi/RevenuePie';
import { RevenueBar } from '@/components/powered-by-namefi/RevenueBar';
import { DomainTableSkeleton } from '@/components/powered-by-namefi/DomainTableSkeleton';
import { RevenueSkeleton } from '@/components/powered-by-namefi/RevenueSkeleton';
import { Gift, BarChart3, Settings } from 'lucide-react';
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
import { PageShell } from '@/components/page-shell';

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
    <PageShell padding="admin" className="space-y-6">
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
              <DomainTable
                domains={(domainsQuery.data as any) ?? []}
                revenueByDomain={revenueByDomainQuery.data?.byDomain}
              />
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
    </PageShell>
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

function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link href="/powered-by-namefi/admin/gifts">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Gift Management</h3>
                <p className="text-sm text-muted-foreground">
                  Send domain gifts to users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                View detailed analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure domain settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
