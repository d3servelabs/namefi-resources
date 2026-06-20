'use client';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';

export function DomainTableSkeleton() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="gap-0 overflow-hidden px-0 py-0">
            <div className="px-3.5 py-3">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="divide-y divide-border/50 border-t border-border/50">
              {Array.from({ length: 5 }).map((__, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                >
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
            </div>
            <div className="px-3.5 pb-3 pt-2.5">
              <Skeleton className="h-8 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* desktop-only table; mobile renders card skeletons via useIsMobile above */}
      <table className="w-full text-sm" /* mobile-ok */>
        <thead className="text-start text-muted-foreground">
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
