'use client';
import { Button } from '@/components/ui/shadcn/button';
import Link from 'next/link';

export function DomainTable({
  domains,
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
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2">Domain</th>
            <th className="py-2">Enabled</th>
            <th className="py-2">Price (USD)</th>
            <th className="py-2">Min-Max Years</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {domains?.map((d) => (
            <tr key={d.normalizedDomainName} className="border-t">
              <td className="py-2 font-medium">{d.normalizedDomainName}</td>
              <td className="py-2">{d.enabled ? 'Yes' : 'No'}</td>
              <td className="py-2">
                {((d.costPerYearInUsdCents ?? 0) / 100).toFixed(2)}
              </td>
              <td className="py-2">
                {d.durationConstraints?.minDurationInYears ?? 1}-
                {d.durationConstraints?.maxDurationInYears ?? 1}
              </td>
              <td className="py-2">
                <Button size="sm" asChild>
                  <Link
                    href={`/powered-by-namefi/admin/${d.normalizedDomainName}`}
                  >
                    View
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
