'use client';
import { Button } from '@/components/ui/shadcn/button';
import Link from 'next/link';

export function DomainTable({
  domains,
  revenueByDomain,
}: {
  domains: Array<{
    normalizedDomainName: string;
    enabled: boolean;
    costPerYearInUsdCents: number | null;
    durationConstraints?: {
      minDurationInYears: number;
      maxDurationInYears: number;
    } | null;
  }>;
  revenueByDomain?: Array<{
    normalizedDomainName: string;
    amountInUsdCents: number;
  }>;
}) {
  // Helper function to get revenue for a domain
  const getRevenueForDomain = (domainName: string) => {
    const revenue = revenueByDomain?.find(
      (r) => r.normalizedDomainName === domainName,
    );
    return revenue ? (revenue.amountInUsdCents / 100).toFixed(2) : '0.00';
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2">Domain</th>
            <th className="py-2">Active</th>
            <th className="py-2">Price (USD)</th>
            <th className="py-2">Total Revenue (USD)</th>
            <th className="py-2">Min Years</th>
            <th className="py-2">Max Years</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {domains?.map((d) => (
            <tr key={d.normalizedDomainName} className="border-t">
              <td className="py-2 font-medium">
                <Link
                  href={`/powered-by-namefi/admin/${d.normalizedDomainName}`}
                >
                  {d.normalizedDomainName}
                </Link>
              </td>
              <td className="py-2">{d.enabled ? 'Yes' : 'No'}</td>
              <td className="py-2">
                {((d.costPerYearInUsdCents ?? 0) / 100).toFixed(2)}
              </td>
              <td className="py-2">
                ${getRevenueForDomain(d.normalizedDomainName)}
              </td>
              <td className="py-2">
                {d.durationConstraints?.minDurationInYears ?? 1}
              </td>
              <td className="py-2">
                {d.durationConstraints?.maxDurationInYears ?? 1}
              </td>
              <td className="py-2">
                <Button size="sm" asChild variant={'secondary'}>
                  <Link
                    href={`/powered-by-namefi/admin/${d.normalizedDomainName}`}
                  >
                    View Details
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
