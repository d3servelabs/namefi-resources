'use client';
import { Skeleton } from '@/components/ui/shadcn/skeleton';

export function DomainTableSkeleton() {
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
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-t">
              <td className="py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="py-3">
                <Skeleton className="h-4 w-10" />
              </td>
              <td className="py-3">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="py-3">
                <Skeleton className="h-8 w-16" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
