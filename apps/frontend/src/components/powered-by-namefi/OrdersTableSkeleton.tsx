'use client';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';

export function OrdersTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
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
