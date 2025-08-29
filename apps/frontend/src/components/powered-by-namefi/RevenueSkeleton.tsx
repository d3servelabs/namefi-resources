'use client';
import { Skeleton } from '@/components/ui/shadcn/skeleton';

export function RevenueSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
