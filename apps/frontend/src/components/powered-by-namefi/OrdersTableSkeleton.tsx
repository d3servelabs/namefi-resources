'use client';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';

export function OrdersTableSkeleton() {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile: stack of card-shaped skeletons mirroring OrderCard's layout.
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="gap-0 overflow-hidden px-0 py-0">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="divide-y divide-border/50 border-t border-border/50">
              {Array.from({ length: 4 }).map((__, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" /* mobile-ok desktop-only */>
        {/* mobile renders card skeletons via useIsMobile (above) */}
        <thead className="text-start text-muted-foreground">
          <tr>
            <th className="py-2">Chain</th>
            <th className="py-2">Domain</th>
            <th className="py-2">Amount (USD)</th>
            <th className="py-2">Status</th>
            <th className="py-2">Created At</th>
            <th className="py-2">Promo</th>
            <th className="py-2">Reason</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-t [&>td]:py-3">
              <td>
                <Skeleton className="h-6 w-6 rounded-full" />
              </td>
              <td>
                <Skeleton className="h-4 w-40" />
              </td>
              <td>
                <Skeleton className="h-4 w-16" />
              </td>
              <td>
                <Skeleton className="h-5 w-20" />
              </td>
              <td>
                <Skeleton className="h-4 w-32" />
              </td>
              <td>
                <Skeleton className="h-4 w-28" />
              </td>
              <td>
                <Skeleton className="h-4 w-40" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
