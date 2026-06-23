'use client';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface DomainRow {
  normalizedDomainName: string;
  enabled: boolean;
  costPerYearInUsdCents: number | null;
  durationConstraints?: {
    minDurationInYears: number;
    maxDurationInYears: number;
  } | null;
}

interface DomainTableProps {
  domains: Array<DomainRow>;
  revenueByDomain?: Array<{
    normalizedDomainName: string;
    amountInUsdCents: number;
  }>;
}

// Shared formatters/cell renderers — the single source of truth for every value
// so the desktop table row and the mobile card render identical content.
const formatRevenue = (
  domainName: string,
  revenueByDomain: DomainTableProps['revenueByDomain'],
) => {
  const revenue = revenueByDomain?.find(
    (r) => r.normalizedDomainName === domainName,
  );
  return revenue ? (revenue.amountInUsdCents / 100).toFixed(2) : '0.00';
};

const formatPrice = (costPerYearInUsdCents: number | null) =>
  ((costPerYearInUsdCents ?? 0) / 100).toFixed(2);

const formatActive = (enabled: boolean) => (enabled ? 'Yes' : 'No');

const getMinYears = (row: DomainRow) =>
  row.durationConstraints?.minDurationInYears ?? 1;

const getMaxYears = (row: DomainRow) =>
  row.durationConstraints?.maxDurationInYears ?? 1;

const adminHref = (domainName: string): Route =>
  `/powered-by-namefi/admin/${encodeURIComponent(domainName)}` as Route;

function DomainNameLink({ domainName }: { domainName: string }) {
  return <Link href={adminHref(domainName)}>{domainName}</Link>;
}

function ViewDetailsButton({ domainName }: { domainName: string }) {
  return (
    <Button
      render={<Link href={adminHref(domainName)} />}
      nativeButton={false}
      size="sm"
      variant="secondary"
    >
      View Details
    </Button>
  );
}

/**
 * One labeled detail row of the mobile card: label pinned to the start, value to
 * the end (the iOS grouped-list convention), mirroring my-domains/domain-card.
 */
function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <dt className="shrink-0 pt-0.5 text-[13px] text-muted-foreground">
        {label}
      </dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * Mobile card representation of a single domain row. Reuses the SAME shared cell
 * renderers/formatters as the desktop table so values stay identical — only the
 * layout differs (a compact grouped list instead of a wide table row).
 */
function DomainCard({
  row,
  revenueByDomain,
}: {
  row: DomainRow;
  revenueByDomain: DomainTableProps['revenueByDomain'];
}) {
  return (
    <Card className="gap-0 overflow-hidden px-0 py-0">
      <div className="px-3.5 py-3 font-medium">
        <DomainNameLink domainName={row.normalizedDomainName} />
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/50">
        <CardRow label="Active">{formatActive(row.enabled)}</CardRow>
        <CardRow label="Price (USD)">
          {formatPrice(row.costPerYearInUsdCents)}
        </CardRow>
        <CardRow label="Total Revenue (USD)">
          ${formatRevenue(row.normalizedDomainName, revenueByDomain)}
        </CardRow>
        <CardRow label="Min Years">{getMinYears(row)}</CardRow>
        <CardRow label="Max Years">{getMaxYears(row)}</CardRow>
      </dl>
      <div className="px-3.5 pb-3 pt-2.5">
        <ViewDetailsButton domainName={row.normalizedDomainName} />
      </div>
    </Card>
  );
}

export function DomainTable({ domains, revenueByDomain }: DomainTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {domains?.map((d) => (
          <DomainCard
            key={d.normalizedDomainName}
            row={d}
            revenueByDomain={revenueByDomain}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* desktop-only table; mobile renders cards via useIsMobile above */}
      <table className="w-full text-sm" /* mobile-ok */>
        <thead className="text-start text-muted-foreground">
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
                <DomainNameLink domainName={d.normalizedDomainName} />
              </td>
              <td className="py-2">{formatActive(d.enabled)}</td>
              <td className="py-2">{formatPrice(d.costPerYearInUsdCents)}</td>
              <td className="py-2">
                ${formatRevenue(d.normalizedDomainName, revenueByDomain)}
              </td>
              <td className="py-2">{getMinYears(d)}</td>
              <td className="py-2">{getMaxYears(d)}</td>
              <td className="py-2">
                <ViewDetailsButton domainName={d.normalizedDomainName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
